<?php

namespace App\Services\Dashboard;

use App\Models\User;
use App\Services\Metrics\FinancialMetricsService;
use App\Services\Metrics\SankeyService;
use App\Support\DateRangeResolver;
use Illuminate\Support\Carbon;

/**
 * خدمة بناء بيانات لوحة التحكم.
 *
 * هذه الخدمة مسؤولة عن تجهيز كل البيانات التي تحتاجها صفحة الداشبورد:
 * - KPIs
 * - السلسلة الزمنية
 * - توزيع التصنيفات
 * - توزيع الحسابات
 * - خريطة الحرارة
 * - آخر العمليات
 * - مخطط سانكي (عبر SankeyService)
 */
class DashboardService
{
    public function __construct(
        protected FinancialMetricsService $metrics,
        protected SankeyService $sankeyService
    ) {
    }

    /**
     * بناء بيانات لوحة التحكم كاملة.
     */
    public function build(
        User $user,
        ?string $range = null,
        ?string $from = null,
        ?string $to = null
    ): array {
        // الداشبورد افتراضيًا يعتمد على "هذا الشهر"
        $range = in_array($range, DateRangeResolver::RANGES, true)
            ? $range
            : 'month';

        $meta = DateRangeResolver::resolveWithMeta($range, $from, $to);

        $since = $meta['since'];
        $until = $meta['until'];

        $prevSince = $meta['previous_since'];
        $prevUntil = $meta['previous_until'];

        // ─────────────────────────────
        // إجماليات الفترة الحالية
        // ─────────────────────────────
        $currentTotals = $this->metrics->periodTotals($user, $since, $until);

        $totalIncome = (float) ($currentTotals->get('income')?->total ?? 0);
        $totalExpense = (float) ($currentTotals->get('expense')?->total ?? 0);
        $txCount = (int) $currentTotals->sum('tx_count');

        // ─────────────────────────────
        // إجماليات الفترة السابقة
        // ─────────────────────────────
        $previousTotals = $this->metrics->periodTotals($user, $prevSince, $prevUntil);

        $prevIncome = (float) ($previousTotals->get('income')?->total ?? 0);
        $prevExpense = (float) ($previousTotals->get('expense')?->total ?? 0);

        // ─────────────────────────────
        // الحسابات والثروة
        // ─────────────────────────────
        $accounts = $user->accounts()->latest()->get();

        $totalWealth = round((float) $accounts->sum('balance'), 2);
        $accountsCount = $accounts->count();

        // ─────────────────────────────
        // توقع نهاية الشهر
        // ─────────────────────────────
        $predictedExpense = null;

        if ($range === 'month') {
            $daysElapsed = max(1, Carbon::now()->day);
            $daysInMonth = Carbon::now()->daysInMonth;

            $predictedExpense = $this->metrics->projectedExpense(
                $totalExpense,
                $daysElapsed,
                $daysInMonth
            );
        }

        // ─────────────────────────────
        // البيانات الأساسية
        // ─────────────────────────────
        $series = $this->metrics->dailyFlow($user, $since, $until);

        $categoryBreakdown = $this->metrics->categoryBreakdown(
            $user,
            $since,
            $until
        );

        $accountBreakdown = $this->metrics->accountBreakdown(
            $user,
            $since,
            $until
        );

        // ─────────────────────────────
        // Heatmap
        // ─────────────────────────────
        [$heatmap, $heatmapLabel] = $this->buildHeatmap(
            $user,
            $since,
            $until,
            $meta['period_label']
        );

        // ─────────────────────────────
        // آخر العمليات
        // ─────────────────────────────
        $recent = $this->recentTransactions($user, $since, $until);

        // ─────────────────────────────
        // Sankey — عبر الخدمة المستقلة
        // ─────────────────────────────
        $sankey = $this->sankeyService->build($user, $since, $until);

        // ─────────────────────────────
        // إرجاع البيانات للواجهة
        // ─────────────────────────────
        return [
            'range' => $meta['range'],
            'customFrom' => $meta['from'],
            'customTo' => $meta['to'],
            'periodLabel' => $meta['period_label'],
            'heatmapLabel' => $heatmapLabel,
            'sankey' => $sankey,

            'kpis' => [
                'totalExpense' => round($totalExpense, 2),
                'totalIncome' => round($totalIncome, 2),
                'netPeriod' => round($totalIncome - $totalExpense, 2),
                'txCount' => $txCount,
                'totalWealth' => $totalWealth,
                'accountsCount' => $accountsCount,
                'prevExpensePct' => $this->metrics->pctChange($totalExpense, $prevExpense),
                'prevIncomePct' => $this->metrics->pctChange($totalIncome, $prevIncome),
                'predictedExpense' => $predictedExpense,
            ],

            'series' => $series,
            'categoryBreakdown' => $categoryBreakdown,
            'accountBreakdown' => $accountBreakdown,
            'accounts' => $accountBreakdown,

            'heatmap' => $heatmap,
            'recent' => $recent,
        ];
    }

    /**
     * بناء خريطة الحرارة.
     */
    protected function buildHeatmap(
        User $user,
        Carbon $since,
        Carbon $until,
        string $periodLabel
    ): array {
        $heatSince = $since->copy()->startOfDay();
        $heatmapLabel = $periodLabel;

        $maxWindow = $until->copy()
            ->subMonthsNoOverflow(6)
            ->startOfDay();

        if ($heatSince->lt($maxWindow)) {
            $heatSince = $maxWindow;
            $heatmapLabel = 'آخر 6 أشهر';
        }

        $points = $this->metrics->dailyFlow($user, $heatSince, $until);

        $heatmap = array_map(fn (array $point) => [
            'date' => $point['date'],
            'expense' => $point['expense'],
            'income' => $point['income'],
        ], $points);

        return [$heatmap, $heatmapLabel];
    }

    /**
     * آخر العمليات داخل الفترة المختارة.
     */
    protected function recentTransactions(
        User $user,
        Carbon $since,
        Carbon $until
    ) {
        return $user->transactions()
            ->with([
                'category' => fn ($query) => $query->withTrashed(),
                'account' => fn ($query) => $query->withTrashed(),
            ])
            ->whereBetween('transaction_date', [$since, $until])
            ->orderByDesc('transaction_date')
            ->limit(10)
            ->get()
            ->map(fn ($transaction) => [
                'id' => $transaction->id,
                'description' => $transaction->description,
                'type' => $transaction->type,
                'account' => $transaction->account?->name ?? '—',
                'category' => $transaction->category?->name ?? 'غير مصنف',
                'category_color' => $transaction->category?->color_hex ?? '#5a8068',
                'date' => $transaction->transaction_date?->format('d/m/Y'),
                'amount' => round((float) $transaction->amount, 2),
            ])
            ->values();
    }
}