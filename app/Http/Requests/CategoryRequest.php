<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {

        return true;
    }

    public function rules(): array
    {
        return [
            'name'      => ['required', 'string', 'max:30'],
            'icon'      => ['nullable', 'string', 'max:50'],
            'color_hex' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'   => 'اسم التصنيف مطلوب',
            'name.max'        => 'الاسم طويل جدًا (30 حرفًا كحد أقصى)',
            'color_hex.regex' => 'صيغة اللون غير صحيحة (#RRGGBB)',
        ];
    }
}