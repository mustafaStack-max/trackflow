<?php

namespace App\Services\Metrics;

use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * خدمة بناء مخطط Sankey.
 *
 * المخطط يعرض تدفق الأموال بهذا الشكل:
 *
 * الدخل ← الحسابات
 * الحسابات ← التصنيفات
 *
 * مثال:
 * الراتب ← الحساب البنكي
 * الحساب البنكي ← الأكل
 * الحساب البنكي ← النقل
 */
class SankeyService
{
    /**
     * بناء بيانات مخطط Sankey للفترة المختارة.
     */
    public function build(
        User $user,
        Carbon $since,
        Carbon $until
    ): array {
        $transactions = $user->transactions()
            ->with([
                'account' => fn ($query) => $query
                    ->withTrashed()
                    ->select('id', 'name', 'color_hex'),

                'category' => fn ($query) => $query
                    ->withTrashed()
                    ->select('id', 'name', 'color_hex'),
            ])
            ->whereBetween('transaction_date', [$since, $until])
            ->get();

        $nodes = [];
        $links = [];

        foreach ($transactions as $transaction) {
            $amount = (float) $transaction->amount;

            $accountName = $transaction->account?->name ?? 'حساب مجهول';
            $accountColor = $transaction->account?->color_hex ?? '#00d4ff';

            if ($transaction->type === 'income') {
                // مصدر الدخل ← الحساب
                $source = $transaction->description ?: 'مداخيل أخرى';

                $this->addNode($nodes, $source, '#00e676');
                $this->addNode($nodes, $accountName, $accountColor);
                $this->addLink($links, $source, $accountName, $amount);
            } else {
                // الحساب ← التصنيف
                $categoryName = $transaction->category?->name ?? 'غير مصنف';
                $categoryColor = $transaction->category?->color_hex ?? '#ff5c5c';

                $this->addNode($nodes, $accountName, $accountColor);
                $this->addNode($nodes, $categoryName, $categoryColor);
                $this->addLink($links, $accountName, $categoryName, $amount);
            }
        }

        return [
            'nodes' => array_values($nodes),
            'links' => $this->prepareLinks($links),
        ];
    }

    /**
     * إضافة عقدة إلى مخطط Sankey.
     *
     * العقدة يمكن أن تكون:
     * - مصدر دخل
     * - حساب
     * - تصنيف مصروف
     */
    protected function addNode(
        array &$nodes,
        string $name,
        string $color
    ): void {
        if (! isset($nodes[$name])) {
            $nodes[$name] = [
                'name' => $name,
                'color' => $color,
            ];
        }
    }

    /**
     * إضافة رابط بين عقدتين.
     *
     * إذا تكرر نفس الرابط عدة مرات،
     * نجمع القيم في رابط واحد.
     */
    protected function addLink(
        array &$links,
        string $source,
        string $target,
        float $value
    ): void {
        $key = $source . '→' . $target;

        if (! isset($links[$key])) {
            $links[$key] = [
                'source' => $source,
                'target' => $target,
                'value' => 0.0,
            ];
        }

        $links[$key]['value'] += $value;
    }

    /**
     * تجهيز الروابط النهائية.
     *
     * - تقريب القيم
     * - حذف الروابط التي قيمتها صفر
     * - إعادة ترقيم المصفوفة
     */
    protected function prepareLinks(array $links): array
    {
        return array_values(
            array_filter(
                array_map(
                    fn (array $link) => [
                        'source' => $link['source'],
                        'target' => $link['target'],
                        'value' => round($link['value'], 2),
                    ],
                    $links
                ),
                fn (array $link) => $link['value'] > 0
            )
        );
    }
}