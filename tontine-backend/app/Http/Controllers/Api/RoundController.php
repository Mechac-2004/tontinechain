<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tontine;
use App\Models\Round;
use App\Models\Payment;
use App\Services\TontineService;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RoundController extends Controller
{
    protected $tontineService;

    public function __construct(TontineService $tontineService)
    {
        $this->tontineService = $tontineService;
    }

    public function release($id)
    {
        $tontine = Tontine::findOrFail($id);
        $currentRound = $tontine->rounds()->where('status', 'current')->first();

        if (!$currentRound) {
            return response()->json(['message' => 'Aucun tour actif à libérer.'], 400);
        }

        $result = $this->tontineService->disburseCagnotte($currentRound);
        return response()->json($result);
    }

    public function releaseCagnotte(Request $request, $roundId)
    {
        $round = Round::findOrFail($roundId);
        $result = $this->tontineService->disburseCagnotte($round);

        return response()->json($result);
    }

    public function startTontine($id)
    {
        $tontine = Tontine::with('members')->findOrFail($id);

        if ($tontine->status !== 'pending') {
            return response()->json(['message' => 'La tontine a déjà démarré ou est terminée.'], 400);
        }

        if ($tontine->members()->count() < $tontine->max_members) {
            return response()->json(['message' => 'Nombre de membres insuffisant pour démarrer.'], 400);
        }

        try {
            DB::beginTransaction();

            // Assigner un ordre de passage aléatoire aux membres
            $members = $tontine->members;
            $shuffled = $members->shuffle();
            
            foreach ($shuffled as $index => $member) {
                $member->pivot->update(['turn_order' => $index + 1]);
            }

            // Créer les rounds
            $startDate = Carbon::parse($tontine->start_date);
            
            for ($i = 1; $i <= $tontine->max_members; $i++) {
                // Re-récupérer les membres avec les pivots mis à jour pour trouver le bénéficiaire
                $beneficiary = $tontine->members()->wherePivot('turn_order', $i)->first();
                
                if (!$beneficiary) {
                    throw new \Exception("Bénéficiaire introuvable pour le tour $i");
                }

                $round = Round::create([
                    'tontine_id' => $tontine->id,
                    'round_number' => $i,
                    'beneficiary_id' => $beneficiary->id,
                    'start_date' => $startDate->copy(),
                    'end_date' => $this->calculateEndDate($startDate, $tontine->frequency),
                    'status' => ($i === 1) ? 'current' : 'pending',
                ]);

                // Créer les entrées de paiement pour chaque membre pour ce round
                foreach ($tontine->members as $member) {
                    Payment::create([
                        'round_id' => $round->id,
                        'user_id' => $member->id,
                        'amount' => $tontine->contribution_amount,
                        'status' => 'unpaid',
                    ]);
                }

                $startDate = Carbon::parse($round->end_date)->addDay();
            }

            $tontine->update(['status' => 'active']);

            DB::commit();

            return response()->json(['message' => 'Tontine démarrée et rounds générés avec succès.']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Start Tontine Error: " . $e->getMessage());
            return response()->json(['message' => 'Une erreur est survenue lors du démarrage : ' . $e->getMessage()], 500);
        }
    }

    private function calculateEndDate($startDate, $frequency)
    {
        $date = Carbon::parse($startDate);
        switch ($frequency) {
            case 'monthly':
                return $date->addMonth()->subDay();
            case 'weekly':
                return $date->addWeek()->subDay();
            default:
                return $date->addMonth()->subDay();
        }
    }
}
