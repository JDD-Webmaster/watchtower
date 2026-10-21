<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class OrganizationUser extends Pivot
{
    public $incrementing = true;

    protected $table = 'organization_user';
}
