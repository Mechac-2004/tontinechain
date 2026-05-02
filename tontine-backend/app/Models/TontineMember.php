<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TontineMember extends Model
{
    protected $fillable = [
        'tontine_id',
        'user_id',
        'turn_order',
        'status',
    ];

    public function tontine()
    {
        return $this->belongsTo(Tontine::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
