<?php

namespace App\Http\Controllers;

use App\Http\Requests\RangeQueryRequest;
use App\Services\Dashboard\DashboardService;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {
    }

    public function index(RangeQueryRequest $request)
    {
        [$range, $from, $to] = $request->rangeArguments();

        $data = $this->dashboardService->build(
            user: $request->user(),
            range: $range,
            from: $from,
            to: $to
        );

        return Inertia::render('Dashboard', $data);
    }
}