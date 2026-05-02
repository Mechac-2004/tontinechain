<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tontine extends Model
{
    protected $fillable = [
        'name',
        'description',
        'contribution_amount',
        'total_amount',
        'frequency',
        'max_members',
        'start_date',
        'status',
        'created_by',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'tontine_members')
                    ->withPivot('turn_order', 'status')
                    ->withTimestamps();
    }

    public function rounds()
    {
        return $this->hasMany(Round::class);
    }
}
