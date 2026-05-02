<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tontine;
use App\Models\TontineMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TontineController extends Controller
{
    public function index()
    {
        return response()->json(Tontine::with('creator')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'contribution_amount' => 'required|numeric',
            'max_members' => 'required|integer',
            'frequency' => 'required|string',
            'start_date' => 'required|date',
        ]);

        $tontine = Tontine::create([
            'name' => $request->name,
            'description' => $request->description,
            'contribution_amount' => $request->contribution_amount,
            'total_amount' => $request->contribution_amount * $request->max_members,
            'frequency' => $request->frequency,
            'max_members' => $request->max_members,
            'start_date' => $request->start_date,
            'status' => 'pending',
            'created_by' => auth()->id(),
        ]);

        // Le créateur est automatiquement membre
        TontineMember::create([
            'tontine_id' => $tontine->id,
            'user_id' => auth()->id(),
            'turn_order' => 1,
            'status' => 'active',
        ]);

        return response()->json($tontine, 201);
    }

    public function join(Request $request, $id)
    {
        $tontine = Tontine::findOrFail($id);

        if ($tontine->members()->count() >= $tontine->max_members) {
            return response()->json(['message' => 'Tontine is full'], 400);
        }

        if ($tontine->members()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Already a member'], 400);
        }

        TontineMember::create([
            'tontine_id' => $tontine->id,
            'user_id' => auth()->id(),
            'status' => 'active',
        ]);

        return response()->json(['message' => 'Joined successfully']);
    }

    public function show($id)
    {
        return response()->json(Tontine::with(['members', 'rounds.payments'])->findOrFail($id));
    }

    public function status($id)
    {
        $tontine = Tontine::with(['rounds' => function($query) {
            $query->where('status', 'current');
        }, 'rounds.beneficiary'])->findOrFail($id);

        $currentRound = $tontine->rounds->first();

        return response()->json([
            'tontine' => $tontine->name,
            'status' => $tontine->status,
            'current_round' => $currentRound ? $currentRound->round_number : null,
            'beneficiary' => $currentRound ? $currentRound->beneficiary->name : null,
            'is_fully_paid' => $currentRound ? (new \App\Services\TontineService())->isRoundFullyPaid($currentRound) : false,
        ]);
    }
}
