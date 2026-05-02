<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TontineController;
use App\Http\Controllers\Api\RoundController;
use App\Http\Controllers\Api\PaymentController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Tontines
    Route::get('/tontines', [TontineController::class, 'index']);
    Route::post('/tontines', [TontineController::class, 'store']);
    Route::get('/tontines/{id}', [TontineController::class, 'show']);
    Route::post('/tontines/{id}/members', [TontineController::class, 'join']);
    Route::get('/tontines/{id}/status', [TontineController::class, 'status']);

    // Rounds
    Route::post('/tontines/{id}/start', [RoundController::class, 'startTontine']);
    Route::post('/tontines/{id}/release', [RoundController::class, 'release']);

    // Payments
    Route::get('/my-payments', [PaymentController::class, 'myPayments']);
    Route::post('/payments/pay', [PaymentController::class, 'pay']);
});
