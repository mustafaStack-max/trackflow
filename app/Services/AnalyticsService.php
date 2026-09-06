<?php

namespace App\Services;

use App\Models\User;
use App\Support\DateRangeResolver;

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


    protected function overview(User $user, array $meta): ?array
    {
    
        return null;
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