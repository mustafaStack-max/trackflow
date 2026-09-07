<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

class CategoryPolicy
{
    /**
     * Create a new policy instance.
     */
    public function __construct()
    {
        //
    }

    public function create(User $user) : bool
    {
        return true ;
    }

    public function update(User $user , Category $category) 
    {
        return ! $category->is_system && $category->user_id === $user->id ;
    } 
    public function delete(User $user, Category $category): bool
    {
        return ! $category->is_system
            && $category->user_id === $user->id;
    }

}
