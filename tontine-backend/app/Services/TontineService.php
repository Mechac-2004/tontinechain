<?php

namespace App\Services;

use App\Models\Tontine;
use App\Models\Round;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class TontineService
{
    /**
     * Vérifie si tous les membres ont payé pour un round donné.
     */
    public function isRoundFullyPaid(Round $round): bool
    {
        $unpaidPayments = $round->payments()->where('status', 'unpaid')->count();
        Log::info("Vérification paiements Round #{$round->round_number} : {$unpaidPayments} manquants.");
        return $unpaidPayments === 0;
    }

    /**
     * Tente de libérer la cagnotte pour le bénéficiaire du round actuel.
     */
    public function disburseCagnotte(Round $round)
    {
        if (!$this->isRoundFullyPaid($round)) {
            return [
                'success' => false,
                'message' => 'Certains membres n\'ont pas encore payé pour ce tour. La tontine est bloquée.',
            ];
        }

        $round->update(['status' => 'finished']);
        
        // Passer au round suivant
        return $this->activateNextRound($round->tontine_id);
    }

    /**
     * Active le prochain round selon l'ordre de passage.
     */
    public function activateNextRound(int $tontineId)
    {
        $tontine = Tontine::find($tontineId);
        $currentRound = $tontine->rounds()->where('status', 'current')->first();
        
        if ($currentRound) {
            $currentRound->update(['status' => 'finished']);
        }

        $nextRoundNumber = $currentRound ? $currentRound->round_number + 1 : 1;
        $nextRound = $tontine->rounds()->where('round_number', $nextRoundNumber)->first();

        if ($nextRound) {
            $nextRound->update(['status' => 'current']);
            return [
                'success' => true,
                'message' => 'Nouveau tour activé pour ' . $nextRound->beneficiary->name,
                'round' => $nextRound
            ];
        }

        $tontine->update(['status' => 'completed']);
        return [
            'success' => true,
            'message' => 'Tontine terminée avec succès.',
        ];
    }

    /**
     * Gère un paiement et déclenche les vérifications nécessaires.
     */
    public function processPayment(Payment $payment)
    {
        $payment->update([
            'status' => 'paid',
            'payment_date' => now(),
        ]);

        $round = $payment->round;
        
        if ($this->isRoundFullyPaid($round)) {
            return [
                'success' => true,
                'message' => 'Paiement effectué. Le round est désormais complet et prêt pour la libération de la cagnotte.',
                'can_disburse' => true
            ];
        }

        return [
            'success' => true,
            'message' => 'Paiement enregistré.',
            'can_disburse' => false
        ];
    }
}
