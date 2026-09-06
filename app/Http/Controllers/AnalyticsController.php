<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Analytics', [
            'range' => '90d',
            'customFrom' => null,
            'customTo' => null,
            'periodLabel' => 'آخر 3 أشهر',
            'previousPeriodLabel' => 'الفترة السابقة',

            'overview' => null,
            'changeAnalysis' => null,
            'trends' => [],
            'concentration' => null,
            'insights' => [],
        ]);
    }
}