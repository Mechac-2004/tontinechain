<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Round extends Model
{
    protected $fillable = [
        'tontine_id',
        'round_number',
        'beneficiary_id',
        'start_date',
        'end_date',
        'status',
    ];

    public function tontine()
    {
        return $this->belongsTo(Tontine::class);
    }

    public function beneficiary()
    {
        return $this->belongsTo(User::class, 'beneficiary_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
