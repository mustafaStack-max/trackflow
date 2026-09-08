<?php

namespace App\Services\Metrics;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;


class WealthMetricsService
{
    public function __construct(
        protected FinancialMetricsService $metrics
    ) {
    }


    public function wealthFlow(User $user, Carbon $since, Carbon $until): array
    {

        $accounts = $user->accounts()->withTrashed()->get();

        if ($accounts->isEmpty()) {
            return ['lines' => [], 'points' => [], 'current' => 0.0, 'start' => 0.0];
        }

        $start = $since->copy()->startOfDay();
        $end = $until->copy()->endOfDay();

   
        $allNet = $user->transactions()
            ->selectRaw("
                account_id,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as net
            ")
            ->groupBy('account_id')
            ->pluck('net', 'account_id');

        $initials = [];
        foreach ($accounts as $a) {
        
            $initialBalance = $a->initial_balance ?? ((float) $a->balance - (float) ($allNet[$a->id] ?? 0));
            $initials[$a->id] = (float) $initialBalance;
        }

 
        $preNet = $user->transactions()
            ->where('transaction_date', '<', $start)
            ->selectRaw("
                account_id,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as net
            ")
            ->groupBy('account_id')
            ->pluck('net', 'account_id');


        $running = [];
        foreach ($accounts as $a) {
            $running[$a->id] = $initials[$a->id] + (float) ($preNet[$a->id] ?? 0);
        }

    
        $dayExpr = $this->metrics->dayExpression();

        $rows = $user->transactions()
            ->whereBetween('transaction_date', [$start, $end])
            ->selectRaw("
                {$dayExpr} as day,
                account_id,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as net
            ")
            ->groupBy(DB::raw($dayExpr), 'account_id')
            ->get();

        $byDay = [];
        foreach ($rows as $r) {
            $byDay[$r->day][(int) $r->account_id] = (float) $r->net;
        }


        $makePoint = function (string $date) use (&$running, $accounts) {
            $point = ['date' => $date];
            $total = 0.0;
            foreach ($accounts as $a) {
                $point['acc_' . $a->id] = round($running[$a->id], 2);
                $total += $running[$a->id];
            }
            $point['total'] = round($total, 2);
            return $point;
        };

     
        $points = [];
        
 
        $open = $makePoint($start->format('Y-m-d'));
        $points[] = $open;

        $cursor = $start->copy()->addDay();
        $lastEmitted = $open['date'];

        while ($cursor->lte($end)) {
            $key = $cursor->format('Y-m-d');
            $dayNets = $byDay[$key] ?? [];

      
            if ($dayNets) {
                foreach ($dayNets as $accId => $net) {
                    if (isset($running[$accId])) {
                        $running[$accId] += $net;
                    }
                }
                $points[] = $makePoint($key);
                $lastEmitted = $key;
            }

            $cursor->addDay();
        }

        
        if ($lastEmitted !== $end->format('Y-m-d')) {
            $points[] = $makePoint($end->format('Y-m-d'));
        }

       
        $lines = $accounts->map(fn ($a) => [
            'key' => 'acc_' . $a->id,
            'name' => $a->name,
            'color' => $a->color_hex,
        ])->values()->toArray();

        $lines[] = ['key' => 'total', 'name' => 'الثروة الإجمالية', 'color' => '#ffc107'];


        $currentWealth = (float) $user->accounts()->sum('balance');

        return [
            'lines' => $lines,
            'points' => $points,
            'current' => round($currentWealth, 2),
            'start' => $open['total'],
        ];
    }
}