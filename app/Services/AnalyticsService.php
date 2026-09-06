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


/**
 * T6 — الاتجاهات الشهرية.
 */
protected function trends(User $user, array $meta): array
{
    [$start, $end] = $this->trendBounds($meta);

    $monthExpression = $this->monthExpression();

    $rows = $user->transactions()
        ->whereBetween('transactions.transaction_date', [$start, $end])
        ->selectRaw("
            {$monthExpression} as month,
            transactions.type,
            COALESCE(SUM(transactions.amount), 0) as total,
            COUNT(transactions.id) as tx_count
        ")
        ->groupBy(DB::raw($monthExpression), 'transactions.type')
        ->get()
        ->groupBy('month');

    $result = [];

    $cursor = $start->copy()->startOfMonth();

    while ($cursor->lte($end)) {
        $key = $cursor->format('Y-m');

        $monthRows = $rows->get($key, collect());

        $income = (float) $monthRows->where('type', 'income')->sum('total');
        $expense = (float) $monthRows->where('type', 'expense')->sum('total');
        $txCount = (int) $monthRows->sum('tx_count');

        $net = $income - $expense;

        $result[] = [
            'month' => $key,
            'label' => $this->monthLabel($cursor),

            'income' => round($income, 2),
            'expense' => round($expense, 2),
            'net' => round($net, 2),

            'savingsRate' => $income > 0
                ? round(($net / $income) * 100, 1)
                : null,

            'txCount' => $txCount,
        ];

        $cursor->addMonthNoOverflow();
    }

    return $result;
}


    protected function concentration(User $user, array $meta): ?array
    {
    
        return null;
    }

  
    protected function insights(User $user, array $meta): array
    {
    
        return [];
    }

    /**
 * تحديد بداية ونهاية الأشهر الخاصة بمخطط الاتجاهات.
 */
protected function trendBounds(array $meta): array
{
    $end = $meta['until']->copy()->endOfMonth();

    if ($meta['range'] === 'ytd') {
        $start = $meta['since']->copy()->startOfMonth();

        return [$start, $end];
    }

    if ($meta['range'] === 'custom') {
        $start = $meta['since']->copy()->startOfMonth();

        // إذا كانت الفترة قصيرة جدًا، نعرض على الأقل 6 أشهر
        $minStart = $end->copy()->subMonthsNoOverflow(5)->startOfMonth();

        if ($start->gt($minStart)) {
            $start = $minStart;
        }

        // لا نعرض أكثر من 24 شهرًا في النسخة الحالية
        $maxStart = $end->copy()->subMonthsNoOverflow(23)->startOfMonth();

        if ($start->lt($maxStart)) {
            $start = $maxStart;
        }

        return [$start, $end];
    }

    $months = match ($meta['range']) {
        '365d', 'all' => 12,
        '6m' => 6,
        default => 6,
    };

    $start = $end->copy()
        ->subMonthsNoOverflow($months - 1)
        ->startOfMonth();

    return [$start, $end];
}

/**
 * تعبير استخراج الشهر حسب نوع قاعدة البيانات.
 */
protected function monthExpression(): string
{
    return match (DB::connection()->getDriverName()) {
        'pgsql' => "to_char(transactions.transaction_date, 'YYYY-MM')",
        'sqlite' => "strftime('%Y-%m', transactions.transaction_date)",
        'sqlsrv' => "FORMAT(transactions.transaction_date, 'yyyy-MM')",
        default => "DATE_FORMAT(transactions.transaction_date, '%Y-%m')",
    };
}

/**
 * تسمية الشهر باللغة العربية.
 */
protected function monthLabel(Carbon $date): string
{
    $months = [
        1 => 'ينا',
        2 => 'فبر',
        3 => 'مار',
        4 => 'أبر',
        5 => 'ماي',
        6 => 'يون',
        7 => 'يول',
        8 => 'غشت',
        9 => 'شتن',
        10 => 'أكت',
        11 => 'نون',
        12 => 'دجن',
    ];

    return $months[$date->month] . ' ' . $date->year;
}
}