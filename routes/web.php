<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TransactionController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('budgets/suggest', [BudgetController::class, 'suggest'])->name('budgets.suggest');
    Route::resource('budgets', BudgetController::class)->except(['create', 'show', 'edit']);

    Route::get('notifications', function (Request $request) {
        return $request->user()->notifications()->latest()->take(15)->get()->map(fn ($n) => [
            'id' => $n->id,
            'message' => $n->data['message'] ?? '',
            'level' => $n->data['level'] ?? 'info',
            'created_at' => $n->created_at?->diffForHumans(),
            'read_at' => $n->read_at,
        ]);
    })->name('notifications.index');

    Route::post('notifications/read-all', function (Request $request) {
        $request->user()->unreadNotifications->markAsRead();
        return back();
    })->name('notifications.readAll');

    Route::post('notifications/{id}/read', function (Request $request, $id) {
        $n = $request->user()->notifications()->findOrFail($id);
        $n->markAsRead();
        return back();
    })->name('notifications.readOne');

    
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
});


Route::get('/accounts' , [AccountController::class , 'index'])->middleware('auth')->name('accounts.index') ;
Route::post('/accounts' , [AccountController::class , 'store'])->middleware('auth')->name('accounts.store') ;
Route::put('/accounts/{account:uuid}' , [AccountController::class , 'update'])->middleware('auth')->name('accounts.update') ;
Route::delete('/accounts/{account:id}' , [AccountController::class , 'destroy'])->middleware('auth')->name('accounts.destroy') ;

Route::get('/categories' , [CategoryController::class , 'index'])->middleware('auth')->name('categories.index') ;
Route::post('/categories' , [CategoryController::class , 'store'])->middleware('auth')->name('categories.store') ;
Route::put('/categories/{category:id}' , [CategoryController::class , 'update'])->middleware('auth')->name('categories.update')  ;
Route::delete('/categories/{category:id}' , [CategoryController::class , 'destroy'])->middleware('auth')->name('categories.destroy')  ;


Route::get('/transactions' , [TransactionController::class , 'index'])->middleware('auth')->name('transactions.index') ;
Route::post('/transactions' , [TransactionController::class , 'store'])->middleware('auth')->name('transactions.store') ;
Route::put('/transactions/{transaction:id}' , [TransactionController::class , 'update'])->middleware('auth')->name('transactions.update')  ;
Route::delete('/transactions/{transaction:id}' , [TransactionController::class , 'destroy'])->middleware('auth')->name('transactions.destroy')  ;


require __DIR__.'/auth.php';