<?php

namespace App\Http\Controllers;

use App\Http\Requests\RangeQueryRequest;
use App\Services\AnalyticsService;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function __construct(
        protected AnalyticsService $analytics
    ) {
    }

    public function index(RangeQueryRequest $request)
    {
        [$range, $from, $to] = $request->rangeArguments();

        $data = $this->analytics->build(
            user: $request->user(),
            range: $range,
            from: $from,
            to: $to
        );

        return Inertia::render('Analytics', $data);
    }
}