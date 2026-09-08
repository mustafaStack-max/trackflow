<?php

namespace App\Http\Requests;

use App\Support\DateRangeResolver;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * طلب مخصص للتحقق من مدخلات الفترة الزمنية.
 *
 * يُستخدم في:
 * - DashboardController
 * - AnalyticsController
 * - أي صفحة تقارير مستقبلية
 */
class RangeQueryRequest extends FormRequest
{

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'range' => [
                'nullable',
                'string',
                Rule::in(DateRangeResolver::RANGES),
            ],

            'from' => [
                'nullable',
                'date',
            ],

            'to' => [
                'nullable',
                'date',
            ],
        ];
    }


    public function messages(): array
    {
        return [
            'range.in' => 'الفترة المختارة غير صالحة.',
            'range.string' => 'قيمة الفترة يجب أن تكون نصًا.',

            'from.date' => 'تاريخ البداية غير صالح.',
            'to.date' => 'تاريخ النهاية غير صالح.',
        ];
    }

    public function range(): ?string
    {
        return $this->validated('range');
    }


    public function from(): ?string
    {
        return $this->validated('from');
    }

    public function to(): ?string
    {
        return $this->validated('to');
    }


    public function rangeArguments(): array
    {
        return [
            $this->range(),
            $this->from(),
            $this->to(),
        ];
    }
}