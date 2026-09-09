<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAccountRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ['string'  , 'max:100'] ,
            "uuid" => ['string' , 'unique:accounts,uuid'] ,
            "type" => ['string'   , Rule::in(['cash','bank','card','savings','other'])] ,
            'balance'=> ['numeric' ] ,
            'currency' =>  [ 'nullable' , 'string' , 'size:3'] ,
            'color_hex' => ['nullable' , 'string' , 'hex_color'] ,
            'is_active' => [ 'nullable' , 'boolean' ]
        ];
    }
}
