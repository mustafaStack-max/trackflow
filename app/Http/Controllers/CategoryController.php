<?php

namespace App\Http\Controllers;

use App\Http\Requests\CategoryRequest;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        /* ★ withCount: عَدّ عمليات الشهر الحالي لكل تصنيف في استعلام واحد */
        $categories = Category::where(function ($q) use ($user) {
                $q->where('is_system', true)
                  ->orWhere('user_id', $user->id);
            })
            ->withCount(['transactions as usage_count' => function ($q) {
                $q->whereMonth('transaction_date', now()->month)
                  ->whereYear('transaction_date', now()->year);
            }])
            ->orderByDesc('usage_count')
            ->orderBy('name')
            ->get();

        return Inertia::render('categories', [
            'Categories' => $categories,
        ]);
    }

    public function store( CategoryRequest $request)
    {
        $this->authorize('create' , Category::class) ;
        $request->user()->categories()->create($request->validated());

        return redirect()->back()->with([
            'success' => true,
            'message' => 'تم إنشاء التصنيف بنجاح',
        ]);
    }

    public function update(CategoryRequest $request, Category $category)
    {
        $this->authorize('update' ,$category) ;
        $category->update($request->validated());

        return redirect()->back()->with([
            'success' => true,
            'message' => 'تم تحديث التصنيف بنجاح',
        ]);
    }

    public function destroy(Request $request, Category $category)
    {
   
        if ($category->is_system) {
            return redirect()->back()->with([
                'success' => false,
                'message' => 'لا يمكن حذف التصنيفات النظامية',
            ]);
        }

        $this->authorize('delete' , $category) ;

        $category->delete();
        if ($category->transactions()->exists()) {
            return redirect()->back()->with([
                'success' => false,
                'message' => 'لا يمكن حذف تصنيف مرتبط بعمليات ',
            ]);
        }


        return redirect()->back()->with([
            'success' => true,
            'message' => 'تم حذف التصنيف بنجاح',
        ]);
    }
}