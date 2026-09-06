<?php

namespace App\Http\Controllers;

use App\Support\DateRangeResolver;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $meta = DateRangeResolver::resolveWithMeta(
            $request->input('range', DateRangeResolver::DEFAULT_RANGE),
            $request->input('from'),
            $request->input('to')
        );

        return Inertia::render('Analytics', [
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

            'overview' => null,
            'changeAnalysis' => null,
            'trends' => [],
            'concentration' => null,
            'insights' => [],
        ]);
    }
}