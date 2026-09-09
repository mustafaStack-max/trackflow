<?php

namespace App\Policies;

use App\Models\Account;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class AccountPolicy
{
    /**
     * Create a new policy instance.
     */
    public function __construct()
    {

        
    }
        public function viewAny(User $user): bool
    {
        return true;
    }
        public function view(User $user, Account $account): bool    { return $user->id === $account->user_id; }
        public function create(User $user)
        {
          return $user->accounts()->count() < 10 
           ? Response::allow()
            : Response::deny('You have reached the maximum number of accounts.');
        }
        public function update(User $user , Account $account)
        {
            return $user->id === $account->user_id ;
        }
        public function delete (User $user , Account $account)
        {

           return $user->id === $account->user_id ;
        }

}
