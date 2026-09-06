<?php

namespace App\Http\Controllers;

use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function index(Request $request, AnalyticsService $analytics)
    {
        $data = $analytics->build(
            $request->user(),
            $request->input('range'),
            $request->input('from'),
            $request->input('to')
        );

        return Inertia::render('Analytics', $data);
    }
}