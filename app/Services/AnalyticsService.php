<?php

namespace App\Services;

use App\Models\User;
use App\Support\DateRangeResolver;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{

    public function build(User $user, ?string $range = null, ?string $from = null, ?string $to = null): array
    {
        $meta = DateRangeResolver::resolveWithMeta($range, $from, $to);

        return [
            'range' => $meta['range'],
            'customFrom' => $meta['from'],
            'customTo' => $meta['to'],

            'periodLabel' => $meta['period_label'],
            'previousPeriodLabel' => $meta['previous_label'],

            'period' => [
                'from' => $meta['period_from'],
                'to' => $meta['period_to'],
                'days' => $meta['days'],
                'prevFrom' => $meta['previous_since']->format('Y-m-d'),
                'prevTo' => $meta['previous_until']->format('Y-m-d'),
            ],

            'overview' => $this->overview($user, $meta),
            'changeAnalysis' => $this->changeAnalysis($user, $meta),
            'trends' => $this->trends($user, $meta),
            'concentration' => $this->concentration($user, $meta),
            'insights' => $this->insights($user, $meta),
        ];
    }


    protected function overview(User $user, array $meta): array
    {
        $since = $meta['since'];
        $until = $meta['until'];

        $prevSince = $meta['previous_since'];
        $prevUntil = $meta['previous_until'];

        $current = $this->periodTotals($user, $since, $until);
        $previous = $this->periodTotals($user, $prevSince, $prevUntil);

        $income = (float) ($current->get('income')?->total ?? 0);
        $expense = (float) ($current->get('expense')?->total ?? 0);

        $txCount = (int) ($current->get('income')?->tx_count ?? 0)
            + (int) ($current->get('expense')?->tx_count ?? 0);

        $prevIncome = (float) ($previous->get('income')?->total ?? 0);
        $prevExpense = (float) ($previous->get('expense')?->total ?? 0);

        $prevTxCount = (int) ($previous->get('income')?->tx_count ?? 0)
            + (int) ($previous->get('expense')?->tx_count ?? 0);

        $net = $income - $expense;
        $prevNet = $prevIncome - $prevExpense;

        $savingsRate = $this->savingsRate($income, $expense);
        $prevSavingsRate = $this->savingsRate($prevIncome, $prevExpense);

        $avgDailyExpense = $meta['days'] > 0
            ? round($expense / $meta['days'], 2)
            : 0.0;

        $projectedExpense = null;

        if ($meta['range'] === 'month') {
            $daysElapsed = max(1, Carbon::now()->day);
            $daysInMonth = Carbon::now()->daysInMonth;

            $projectedExpense = $expense > 0
                ? round(($expense / $daysElapsed) * $daysInMonth, 2)
                : 0.0;
        }

        return [
            'income' => round($income, 2),
            'expense' => round($expense, 2),
            'net' => round($net, 2),
            'txCount' => $txCount,

            'savingsRate' => $savingsRate,
            'avgDailyExpense' => $avgDailyExpense,
            'projectedExpense' => $projectedExpense,

            'topCategory' => $this->topExpenseCategory($user, $since, $until),

            'previous' => [
                'income' => round($prevIncome, 2),
                'expense' => round($prevExpense, 2),
                'net' => round($prevNet, 2),
                'txCount' => $prevTxCount,
                'savingsRate' => $prevSavingsRate,
            ],

            'changes' => [
                'incomePct' => $this->pctChange($income, $prevIncome),
                'expensePct' => $this->pctChange($expense, $prevExpense),
                'netDiff' => round($net - $prevNet, 2),
                'txCountDiff' => $txCount - $prevTxCount,
            ],
        ];
    }


    protected function periodTotals(User $user, Carbon $since, Carbon $until): Collection
    {
        return $user->transactions()
            ->whereBetween('transaction_date', [$since, $until])
            ->selectRaw('type, COALESCE(SUM(amount), 0) as total, COUNT(id) as tx_count')
            ->groupBy('type')
            ->get()
            ->keyBy('type');
    }


    protected function topExpenseCategory(User $user, Carbon $since, Carbon $until): ?array
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


    protected function savingsRate(float $income, float $expense): ?float
    {
        if ($income <= 0) {
            return null;
        }

        return round((($income - $expense) / $income) * 100, 1);
    }


    protected function pctChange(float $current, float $previous): ?float
    {
        if ($previous <= 0) {
            return null;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }


    protected function changeAnalysis(User $user, array $meta): ?array
    {
   
        return null;
    }


    protected function trends(User $user, array $meta): array
    {
    
        return [];
    }


    protected function concentration(User $user, array $meta): ?array
    {
    
        return null;
    }

  
    protected function insights(User $user, array $meta): array
    {
    
        return [];
    }
}