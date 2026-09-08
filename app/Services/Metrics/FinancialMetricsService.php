<?php

namespace App\Services\Metrics;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;


class FinancialMetricsService
{

    public function dayExpression(): string
    {
        return match (DB::connection()->getDriverName()) {
            'pgsql' => "to_char(transactions.transaction_date, 'YYYY-MM-DD')",
            'sqlite' => "date(transactions.transaction_date)",
            'sqlsrv' => "CAST(transactions.transaction_date AS DATE)",
            default => "DATE(transactions.transaction_date)",
        };
    }


    public function periodTotals(User $user, Carbon $since, Carbon $until): Collection
    {
        return $user->transactions()
            ->whereBetween('transaction_date', [$since, $until])
            ->selectRaw('
                type,
                COALESCE(SUM(amount), 0) as total,
                COUNT(id) as tx_count
            ')
            ->groupBy('type')
            ->get()
            ->keyBy('type');
    }


    public function totalIncome(User $user, Carbon $since, Carbon $until): float
    {
        $totals = $this->periodTotals($user, $since, $until);
        return (float) ($totals->get('income')?->total ?? 0);
    }


    public function totalExpense(User $user, Carbon $since, Carbon $until): float
    {
        $totals = $this->periodTotals($user, $since, $until);
        return (float) ($totals->get('expense')?->total ?? 0);
    }

    public function transactionCount(User $user, Carbon $since, Carbon $until): int
    {
        $totals = $this->periodTotals($user, $since, $until);
        return (int) $totals->sum('tx_count');
    }

    public function netAmount(User $user, Carbon $since, Carbon $until): float
    {
        return $this->totalIncome($user, $since, $until) 
             - $this->totalExpense($user, $since, $until);
    }

    public function dailyFlow(User $user, Carbon $since, Carbon $until): array
    {
        $dayExpr = $this->dayExpression();

        $rows = $user->transactions()
            ->whereBetween('transactions.transaction_date', [$since, $until])
            ->selectRaw("
                {$dayExpr} as day,
                transactions.type,
                COALESCE(SUM(transactions.amount), 0) as total
            ")
            ->groupBy(DB::raw($dayExpr), 'transactions.type')
            ->get()
            ->groupBy('day');

        $points = [];
        $cumulative = 0;
        $cursor = $since->copy()->startOfDay();
        $end = $until->copy()->endOfDay();

        while ($cursor->lte($end)) {
            $key = $cursor->format('Y-m-d');
            $r = $rows->get($key, collect());

            $income = (float) $r->where('type', 'income')->sum('total');
            $expense = (float) $r->where('type', 'expense')->sum('total');
            $net = $income - $expense;
            $cumulative += $net;

            $points[] = [
                'date' => $key,
                'income' => round($income, 2),
                'expense' => round($expense, 2),
                'net' => round($net, 2),
                'cumulative' => round($cumulative, 2),
            ];

            $cursor->addDay();
        }

        return $points;
    }


    public function categoryBreakdown(User $user, Carbon $since, Carbon $until): array
    {
        return $user->transactions()
            ->leftJoin('categories', 'transactions.category_id', '=', 'categories.id')
            ->whereBetween('transactions.transaction_date', [$since, $until])
            ->where('transactions.type', 'expense')
            ->select(
                'transactions.category_id as category_id',
                'categories.name as category_name',
                'categories.color_hex as category_color',
                DB::raw('COALESCE(SUM(transactions.amount), 0) as total'),
                DB::raw('COUNT(transactions.id) as transactions_count'),
                DB::raw('COALESCE(AVG(transactions.amount), 0) as average_amount')
            )
            ->groupBy('transactions.category_id', 'categories.name', 'categories.color_hex')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'id' => $row->category_id,
                'name' => $row->category_name ?? 'غير مصنف',
                'color_hex' => $row->category_color ?? '#5a8068',
                'total' => round((float) $row->total, 2),
                'count' => (int) $row->transactions_count,
                'avg' => round((float) $row->average_amount, 2),
            ])
            ->values()
            ->all();
    }


    public function accountBreakdown(User $user, Carbon $since, Carbon $until): array
    {
        $accounts = $user->accounts()->latest()->get();

        $accountTotals = $user->transactions()
            ->whereBetween('transactions.transaction_date', [$since, $until])
            ->selectRaw("
                transactions.account_id,
                transactions.type,
                COALESCE(SUM(transactions.amount), 0) as total
            ")
            ->groupBy('transactions.account_id', 'transactions.type')
            ->get()
            ->groupBy('account_id');

        return $accounts->map(function ($account) use ($accountTotals) {
            $rows = $accountTotals->get($account->id, collect());

            return [
                'id' => $account->id,
                'name' => $account->name,
                'type' => $account->type,
                'color_hex' => $account->color_hex,
                'balance' => round((float) $account->balance, 2),
                'income' => round((float) $rows->where('type', 'income')->sum('total'), 2),
                'expense' => round((float) $rows->where('type', 'expense')->sum('total'), 2),
            ];
        })->values()->all();
    }

    public function topExpenseCategory(User $user, Carbon $since, Carbon $until): ?array
    {
        $row = $user->transactions()
            ->leftJoin('categories', 'transactions.category_id', '=', 'categories.id')
            ->where('transactions.type', 'expense')
            ->whereBetween('transactions.transaction_date', [$since, $until])
            ->select(
                'transactions.category_id',
                'categories.name',
                'categories.color_hex',
                DB::raw('COALESCE(SUM(transactions.amount), 0) as total'),
                DB::raw('COUNT(transactions.id) as transactions_count')
            )
            ->groupBy('transactions.category_id', 'categories.name', 'categories.color_hex')
            ->orderByDesc('total')
            ->limit(1)
            ->first();

        if (! $row || (float) $row->total <= 0) {
            return null;
        }

        return [
            'id' => $row->category_id,
            'name' => $row->name ?? 'غير مصنف',
            'color_hex' => $row->color_hex ?? '#5a8068',
            'total' => round((float) $row->total, 2),
            'count' => (int) $row->transactions_count,
        ];
    }

    public function savingsRate(float $income, float $expense): ?float
    {
        if ($income <= 0) {
            return null;
        }

        return round((($income - $expense) / $income) * 100, 1);
    }

    public function pctChange(float $current, float $previous): ?float
    {
        if ($previous <= 0) {
            return null;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    public function avgDailyExpense(float $totalExpense, int $days): float
    {
        if ($days <= 0) {
            return 0.0;
        }

        return round($totalExpense / $days, 2);
    }

    public function projectedExpense(float $currentExpense, int $daysElapsed, int $daysInMonth): float
    {
        if ($daysElapsed <= 0 || $currentExpense <= 0) {
            return 0.0;
        }

        return round(($currentExpense / $daysElapsed) * $daysInMonth, 2);
    }
}