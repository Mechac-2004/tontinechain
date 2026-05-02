<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\TontineService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    protected $tontineService;

    public function __construct(TontineService $tontineService)
    {
        $this->tontineService = $tontineService;
    }

    public function markAsPaid(Request $request, $id)
    {
        $payment = Payment::findOrFail($id);
        $result = $this->tontineService->processPayment($payment);

        return response()->json($result);
    }

    public function pay(Request $request)
    {
        $request->validate([
            'payment_id' => 'required|exists:payments,id'
        ]);

        $payment = Payment::findOrFail($request->payment_id);
        $result = $this->tontineService->processPayment($payment);

        return response()->json($result);
    }

    public function myPayments()
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();
        return response()->json($user->payments()->with('round.tontine')->get());
    }
}
