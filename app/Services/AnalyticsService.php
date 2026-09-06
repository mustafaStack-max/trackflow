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

    $overview = $this->overview($user, $meta);
    $changeAnalysis = $this->changeAnalysis($user, $meta);
    $trends = $this->trends($user, $meta);
    $concentration = $this->concentration($user, $meta);

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

        'overview' => $overview,
        'changeAnalysis' => $changeAnalysis,
        'trends' => $trends,
        'concentration' => $concentration,

        'insights' => $this->insights(
            $user,
            $meta,
            $overview,
            $changeAnalysis,
            $concentration,
            $trends
        ),
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


/**
 * T7 — تركيز المصاريف.
 */
protected function concentration(User $user, array $meta): array
{
    $since = $meta['since'];
    $until = $meta['until'];

    $rows = $user->transactions()
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
        ->get();

    $totalExpense = (float) $rows->sum('total');

    $categories = $rows
        ->map(function ($row) use ($totalExpense) {
            $total = (float) $row->total;

            return [
                'id' => $row->category_id,
                'name' => $row->name ?? 'غير مصنف',
                'color_hex' => $row->color_hex ?? '#5a8068',
                'total' => round($total, 2),
                'count' => (int) $row->transactions_count,
                'pct' => $totalExpense > 0
                    ? round(($total / $totalExpense) * 100, 1)
                    : 0.0,
            ];
        })
        ->filter(fn ($category) => $category['total'] > 0)
        ->sortByDesc('total')
        ->values();

    $top3 = $categories->take(3)->all();

    $top3Total = collect($top3)->sum('total');

    $top3Share = $totalExpense > 0
        ? round(($top3Total / $totalExpense) * 100, 1)
        : 0.0;

    $status = match (true) {
        $top3Share >= 60 => 'high',
        $top3Share >= 40 => 'medium',
        default => 'healthy',
    };

    return [
        'totalExpense' => round($totalExpense, 2),
        'categoriesCount' => $categories->count(),
        'top3' => $top3,
        'top3Share' => $top3Share,
        'status' => $status,
        'message' => $this->concentrationMessage($status, $top3Share),
    ];
}


protected function concentrationMessage(string $status, float $top3Share): string
{
    if ($top3Share <= 0) {
        return 'لا توجد مصاريف كافية لتحليل التركيز.';
    }

    return match ($status) {
        'high' => "تركيز مرتفع: {$top3Share}% من مصاريفك تذهب إلى أكبر 3 تصنيفات فقط.",
        'medium' => "تركيز متوسط: {$top3Share}% من مصاريفك تذهب إلى أكبر 3 تصنيفات.",
        default => "توزيع المصاريف جيد نسبيًا عبر التصنيفات.",
    };
}

  
/**
 * T8 — التوصيات الذكية.
 */
protected function insights(
    User $user,
    array $meta,
    array $overview,
    array $changeAnalysis,
    array $concentration,
    array $trends
): array {
    if ($overview['txCount'] === 0) {
        return [
            [
                'type' => 'info',
                'title' => 'لا توجد بيانات كافية',
                'message' => 'أضف معاملات مالية حتى تتمكن صفحة التحليلات من توليد توصيات ذكية.',
                'impact' => 0,
            ],
        ];
    }

    $insights = collect();

   
    if ($changeAnalysis['direction'] === 'up' && $changeAnalysis['totalChange'] > 0) {
        $top = collect($changeAnalysis['categories'])->firstWhere('diff', '>', 0);

        $message = $top
            ? "ارتفعت المصاريف بمقدار {$this->money($changeAnalysis['totalChange'])} مقارنة بالفترة السابقة. أكبر مساهم في هذا الارتفاع هو «{$top['name']}» بزيادة {$this->money($top['diff'])}."
            : "ارتفعت المصاريف بمقدار {$this->money($changeAnalysis['totalChange'])} مقارنة بالفترة السابقة.";

        $isDanger = $changeAnalysis['totalChangePct'] !== null
            && $changeAnalysis['totalChangePct'] >= 25;

        $insights->push([
            'type' => $isDanger ? 'danger' : 'warning',
            'title' => 'ارتفاع في المصاريف',
            'message' => $message,
            'impact' => $changeAnalysis['totalChange'],
        ]);
    }


    if ($changeAnalysis['direction'] === 'down' && $changeAnalysis['totalChange'] < 0) {
        $top = collect($changeAnalysis['categories'])->firstWhere('diff', '<', 0);

        $message = $top
            ? "انخفضت المصاريف بمقدار {$this->money(abs($changeAnalysis['totalChange']))}. أكبر تحسن جاء من «{$top['name']}» بانخفاض {$this->money(abs($top['diff']))}."
            : "انخفضت المصاريف بمقدار {$this->money(abs($changeAnalysis['totalChange']))} مقارنة بالفترة السابقة.";

        $insights->push([
            'type' => 'success',
            'title' => 'انخفاض في المصاريف',
            'message' => $message,
            'impact' => abs($changeAnalysis['totalChange']),
        ]);
    }

   
    if ($overview['net'] < 0) {
        $insights->push([
            'type' => 'danger',
            'title' => 'الصافي سالب',
            'message' => "لقد صرفت أكثر من دخلك خلال هذه الفترة بمقدار {$this->money(abs($overview['net']))}.",
            'impact' => abs($overview['net']),
        ]);
    }

   
    if ($overview['income'] <= 0 && $overview['expense'] > 0) {
        $insights->push([
            'type' => 'danger',
            'title' => 'لا يوجد دخل مسجل',
            'message' => 'توجد مصاريف بدون دخل مسجل في هذه الفترة، لذلك لا يمكن حساب معدل الادخار.',
            'impact' => $overview['expense'],
        ]);
    } elseif ($overview['savingsRate'] !== null) {
        if ($overview['savingsRate'] < 0) {
            $insights->push([
                'type' => 'danger',
                'title' => 'معدل الادخار سالب',
                'message' => 'أنت تصرف أكثر مما يدخل. حاول تقليل أكبر التصنيفات غير الضرورية.',
                'impact' => abs($overview['net']),
            ]);
        } elseif ($overview['savingsRate'] < 10) {
            $insights->push([
                'type' => 'warning',
                'title' => 'معدل الادخار منخفض',
                'message' => "معدل الادخار الحالي هو {$overview['savingsRate']}%. يُفضّل رفعه تدريجيًا إلى 10% على الأقل.",
                'impact' => 0,
            ]);
        } elseif ($overview['savingsRate'] >= 20) {
            $insights->push([
                'type' => 'success',
                'title' => 'معدل ادخار جيد',
                'message' => "معدل الادخار الحالي هو {$overview['savingsRate']}%. استمر على هذا النمط.",
                'impact' => 0,
            ]);
        }
    }


    if ($overview['projectedExpense'] !== null && $overview['income'] > 0) {
        if ($overview['projectedExpense'] > $overview['income']) {
            $insights->push([
                'type' => 'danger',
                'title' => 'توقع بتجاوز الدخل',
                'message' => "إذا استمر نسق الإنفاق الحالي، فستبلغ مصاريف هذا الشهر حوالي {$this->money($overview['projectedExpense'])}، أي أعلى من الدخل المسجل.",
                'impact' => max(0, $overview['projectedExpense'] - $overview['income']),
            ]);
        } elseif ($overview['projectedExpense'] > $overview['income'] * 0.9) {
            $insights->push([
                'type' => 'warning',
                'title' => 'اقتراب من حدود الدخل',
                'message' => "من المتوقع أن تصل مصاريف هذا الشهر إلى {$this->money($overview['projectedExpense'])}، أي أكثر من 90% من دخلك.",
                'impact' => max(0, $overview['income'] - $overview['projectedExpense']),
            ]);
        }
    }

  
    if ($concentration['totalExpense'] > 0) {
        if ($concentration['status'] === 'high') {
            $insights->push([
                'type' => 'warning',
                'title' => 'تركيز مرتفع في المصاريف',
                'message' => $concentration['message'],
                'impact' => 0,
            ]);
        }

        $topCategory = $concentration['top3'][0] ?? null;

        if ($topCategory && $topCategory['pct'] >= 45) {
            $insights->push([
                'type' => 'warning',
                'title' => 'تصنيف واحد يسيطر على الصرف',
                'message' => "«{$topCategory['name']}» يستهلك {$topCategory['pct']}% من إجمالي مصاريفك.",
                'impact' => $topCategory['total'],
            ]);
        }
    }


    $newCategory = collect($changeAnalysis['categories'])
        ->where('direction', 'new')
        ->where('current', '>', 0)
        ->sortByDesc('current')
        ->first();

    if ($newCategory && $changeAnalysis['currentTotal'] > 0) {
        $share = round(($newCategory['current'] / $changeAnalysis['currentTotal']) * 100, 1);

        if ($share >= 10) {
            $insights->push([
                'type' => 'info',
                'title' => 'تصنيف جديد مؤثر',
                'message' => "ظهر التصنيف «{$newCategory['name']}» في هذه الفترة ويمثل {$share}% من المصاريف.",
                'impact' => $newCategory['current'],
            ]);
        }
    }


    $lastThree = array_slice($trends, -3);

    if (count($lastThree) === 3) {
        $allNegative = collect($lastThree)->every(fn ($month) => ($month['net'] ?? 0) < 0);

        $hasData = collect($lastThree)->contains(
            fn ($month) => ($month['income'] ?? 0) > 0 || ($month['expense'] ?? 0) > 0
        );

        if ($allNegative && $hasData) {
            $insights->push([
                'type' => 'danger',
                'title' => 'نزيف مستمر منذ 3 أشهر',
                'message' => 'الصافي المالي سالب لآخر ثلاثة أشهر متتالية. راجع المصاريف الثابتة أو ابحث عن مصادر دخل إضافية.',
                'impact' => abs(collect($lastThree)->sum('net')),
            ]);
        }
    }

  
    if ($insights->isEmpty()) {
        return [
            [
                'type' => 'info',
                'title' => 'الوضع مستقر',
                'message' => 'لا توجد إشارات مهمة في هذه الفترة. استمر في المتابعة.',
                'impact' => 0,
            ],
        ];
    }

    $severity = fn (string $type): int => match ($type) {
        'danger' => 0,
        'warning' => 1,
        'success' => 2,
        default => 3,
    };

    return $insights
        ->sort(function ($a, $b) use ($severity) {
            $aSeverity = $severity($a['type']);
            $bSeverity = $severity($b['type']);

            if ($aSeverity === $bSeverity) {
                return $b['impact'] <=> $a['impact'];
            }

            return $aSeverity <=> $bSeverity;
        })
        ->take(6)
        ->values()
        ->all();
}


protected function money(float $amount): string
{
    return number_format(round($amount), 0, '.', ',') . ' MAD';
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