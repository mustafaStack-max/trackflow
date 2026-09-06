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


/**
 * T5 — تحليل المقارنة بين الفترة الحالية والسابقة.
 */
protected function changeAnalysis(User $user, array $meta): array
{
    $since = $meta['since'];
    $until = $meta['until'];

    $prevSince = $meta['previous_since'];
    $prevUntil = $meta['previous_until'];

    $currentStart = $since->format('Y-m-d H:i:s');
    $currentEnd = $until->format('Y-m-d H:i:s');

    $previousStart = $prevSince->format('Y-m-d H:i:s');
    $previousEnd = $prevUntil->format('Y-m-d H:i:s');

    $rows = $user->transactions()
        ->leftJoin('categories', 'transactions.category_id', '=', 'categories.id')
        ->where('transactions.type', 'expense')
        ->whereBetween('transactions.transaction_date', [$prevSince, $until])
        ->selectRaw("
            transactions.category_id,
            categories.name,
            categories.color_hex,
            COALESCE(SUM(CASE WHEN transactions.transaction_date BETWEEN ? AND ? THEN transactions.amount ELSE 0 END), 0) as current_total,
            COALESCE(SUM(CASE WHEN transactions.transaction_date BETWEEN ? AND ? THEN transactions.amount ELSE 0 END), 0) as previous_total
        ", [
            $currentStart,
            $currentEnd,
            $previousStart,
            $previousEnd,
        ])
        ->groupBy('transactions.category_id', 'categories.name', 'categories.color_hex')
        ->get();

    $currentTotal = (float) $rows->sum('current_total');
    $previousTotal = (float) $rows->sum('previous_total');

    $totalChange = $currentTotal - $previousTotal;

    $categories = $rows
        ->map(function ($row) use ($totalChange) {
            $current = (float) $row->current_total;
            $previous = (float) $row->previous_total;

            $diff = $current - $previous;

            if ($previous <= 0 && $current > 0) {
                $direction = 'new';
            } elseif ($current <= 0 && $previous > 0) {
                $direction = 'gone';
            } elseif ($diff > 0) {
                $direction = 'up';
            } elseif ($diff < 0) {
                $direction = 'down';
            } else {
                $direction = 'unchanged';
            }

            return [
                'id' => $row->category_id,
                'name' => $row->name ?? 'غير مصنف',
                'color_hex' => $row->color_hex ?? '#5a8068',

                'current' => round($current, 2),
                'previous' => round($previous, 2),

                'diff' => round($diff, 2),
                'pct' => $this->pctChange($current, $previous),

                'contribution' => abs($totalChange) > 0.001
                    ? round(($diff / $totalChange) * 100, 1)
                    : null,

                'direction' => $direction,
            ];
        })
        ->filter(fn ($category) => $category['current'] > 0 || $category['previous'] > 0)
        ->sortByDesc(fn ($category) => abs($category['diff']))
        ->values()
        ->all();

    return [
        'currentTotal' => round($currentTotal, 2),
        'previousTotal' => round($previousTotal, 2),

        'totalChange' => round($totalChange, 2),
        'totalChangePct' => $this->pctChange($currentTotal, $previousTotal),

        'direction' => $totalChange > 0
            ? 'up'
            : ($totalChange < 0 ? 'down' : 'flat'),

        'categories' => $categories,
    ];
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