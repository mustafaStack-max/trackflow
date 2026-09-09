<?php

namespace App\Http\Requests;

use App\Models\Budget;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBudgetRequest extends FormRequest
{

    public function authorize(): bool
    {
        return true;
    }
    public function rules(): array
    {
        return [
            'name' => [
                'nullable',
                'string',
                'max:40',
            ],
            'amount' => [
                'required',
                'numeric',
                'min:1',
                'max:10000000',
            ],
            'period' => [
                'required',
                Rule::in(Budget::PERIODS),
            ],
            'rollover_enabled' => [
                'required',
                'boolean',
            ],
            'warn_pct' => [
                'required',
                'numeric',
                'min:10',
                'max:100',
            ],
            'critical_pct' => [
                'required',
                'numeric',
                'min:11',
                'max:200',
                'gt:warn_pct',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.max' => 'الاسم يجب ألا يتجاوز 40 حرفًا.',
            'amount.required' => 'المبلغ مطلوب.',
            'amount.numeric' => 'المبلغ يجب أن يكون رقمًا.',
            'amount.min' => 'الحد الأدنى يجب أن يكون 1 MAD على الأقل.',
            'amount.max' => 'الحد الأقصى لا يمكن أن يتجاوز 10,000,000 MAD.',
            'period.required' => 'الفترة مطلوبة.',
            'period.in' => 'الفترة المحددة غير صالحة.',
            'rollover_enabled.required' => 'خيار الترحيل مطلوب.',
            'rollover_enabled.boolean' => 'خيار الترحيل يجب أن يكون صح أو خطأ.',
            'warn_pct.required' => 'نسبة التحذير مطلوبة.',
            'warn_pct.numeric' => 'نسبة التحذير يجب أن تكون رقمًا.',
            'warn_pct.min' => 'نسبة التحذير يجب أن تكون 10% على الأقل.',
            'warn_pct.max' => 'نسبة التحذير يجب ألا تتجاوز 100%.',
            'critical_pct.required' => 'نسبة الحرجة مطلوبة.',
            'critical_pct.numeric' => 'نسبة الحرجة يجب أن تكون رقمًا.',
            'critical_pct.min' => 'نسبة الحرجة يجب أن تكون 11% على الأقل.',
            'critical_pct.max' => 'نسبة الحرجة يجب ألا تتجاوز 200%.',
            'critical_pct.gt' => 'يجب أن تكون نسبة الحرجة أعلى من نسبة التحذير.',
        ];
    }
    public function attributes(): array
    {
        return [
            'name' => 'اسم الميزانية',
            'amount' => 'المبلغ',
            'period' => 'الفترة',
            'rollover_enabled' => 'الترحيل',
            'warn_pct' => 'نسبة التحذير',
            'critical_pct' => 'نسبة الحرجة',
        ];
    }
}