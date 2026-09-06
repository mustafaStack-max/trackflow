<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use Throwable;

class DateRangeResolver
{
    public const DEFAULT_RANGE = '90d';

    public const RANGES = [
        'month',
        'lastMonth',
        '30d',
        '90d',
        '6m',
        'ytd',
        '365d',
        'all',
        'custom',
    ];

    /**
     * يرجع كل المعلومات المتعلقة بالفترة المختارة.
     */
    public static function resolveWithMeta(?string $range, ?string $from = null, ?string $to = null): array
    {
        $range = self::normalizeRange($range);

        [$since, $until, $periodLabel] = self::resolve($range, $from, $to);
        [$prevSince, $prevUntil] = self::previousPeriod($since, $until);

        return [
            'range' => $range,
            'from' => $from,
            'to' => $to,

            'since' => $since,
            'until' => $until,

            'period_label' => $periodLabel,
            'period_from' => $since->format('Y-m-d'),
            'period_to' => $until->format('Y-m-d'),

            'previous_since' => $prevSince,
            'previous_until' => $prevUntil,

            'previous_label' => self::formatRange($prevSince, $prevUntil),
            'days' => self::daysBetween($since, $until),
        ];
    }

    /**
     * يحسب الفترة الحالية حسب النوع المختار.
     */
    public static function resolve(?string $range, ?string $from = null, ?string $to = null): array
    {
        $range = self::normalizeRange($range);
        $now = Carbon::now();

        [$since, $until, $label] = match ($range) {
            'month' => [
                $now->copy()->startOfMonth(),
                $now->copy()->endOfDay(),
                'هذا الشهر',
            ],

            'lastMonth' => [
                $now->copy()->subMonthNoOverflow()->startOfMonth(),
                $now->copy()->subMonthNoOverflow()->endOfMonth(),
                'الشهر الماضي',
            ],

            '30d' => [
                $now->copy()->subDays(29)->startOfDay(),
                $now->copy()->endOfDay(),
                'آخر 30 يوم',
            ],

            '90d' => [
                $now->copy()->subDays(89)->startOfDay(),
                $now->copy()->endOfDay(),
                'آخر 3 أشهر',
            ],

            '6m' => [
                $now->copy()->subMonthsNoOverflow(6)->startOfDay(),
                $now->copy()->endOfDay(),
                'آخر 6 أشهر',
            ],

            'ytd' => [
                $now->copy()->startOfYear(),
                $now->copy()->endOfDay(),
                'هذه السنة',
            ],

            '365d' => [
                $now->copy()->subDays(364)->startOfDay(),
                $now->copy()->endOfDay(),
                'آخر سنة',
            ],

            'all' => [
                Carbon::create(2020, 1, 1)->startOfDay(),
                $now->copy()->endOfDay(),
                'كل السجل',
            ],

            'custom' => self::resolveCustom($from, $to),

            default => [
                $now->copy()->startOfMonth(),
                $now->copy()->endOfDay(),
                'هذا الشهر',
            ],
        };

        // إذا كانت التواريخ مقلوبة، نصلحها تلقائيًا
        if ($since->gt($until)) {
            [$since, $until] = [$until->copy(), $since->copy()];
        }

        return [$since, $until, $label];
    }

    /**
     * الفترة السابقة بنفس طول الفترة الحالية.
     */
    public static function previousPeriod(Carbon $since, Carbon $until): array
    {
        $length = (int) round($since->diffInSeconds($until));

        $prevUntil = $since->copy()->subSecond();
        $prevSince = $prevUntil->copy()->subSeconds($length);

        return [$prevSince, $prevUntil];
    }

    /**
     * عدد الأيام داخل الفترة.
     * نرجع 1 على الأقل حتى لا نقسم على الصفر لاحقًا.
     */
    public static function daysBetween(Carbon $since, Carbon $until): int
    {
        $days = (int) $since->copy()->startOfDay()->diffInDays($until->copy()->startOfDay());

        return max(1, $days + 1);
    }

    /**
     * تأكد أن الفترة المخصصة صالحة.
     */
    protected static function resolveCustom(?string $from, ?string $to): array
    {
        $now = Carbon::now();

        try {
            $start = $from
                ? Carbon::parse($from)->startOfDay()
                : $now->copy()->subDays(29)->startOfDay();

            $end = $to
                ? Carbon::parse($to)->endOfDay()
                : $now->copy()->endOfDay();
        } catch (Throwable) {
            $start = $now->copy()->subDays(29)->startOfDay();
            $end = $now->copy()->endOfDay();
        }

        if ($start->gt($end)) {
            [$start, $end] = [$end->copy(), $start->copy()];
        }

        return [
            $start,
            $end,
            'فترة مخصصة',
        ];
    }

    /**
     * إذا أرسل المستخدم range غير صالح، نرجع الافتراضي.
     */
    protected static function normalizeRange(?string $range): string
    {
        if (! $range) {
            return self::DEFAULT_RANGE;
        }

        return in_array($range, self::RANGES, true)
            ? $range
            : self::DEFAULT_RANGE;
    }

    /**
     * تنسيق بسيط لعرض الفترة في الواجهة.
     */
    protected static function formatRange(Carbon $since, Carbon $until): string
    {
        return $since->format('d/m/Y') . ' - ' . $until->format('d/m/Y');
    }
}