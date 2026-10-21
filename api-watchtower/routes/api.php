<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DeadlineItemController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\ReminderRuleController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    Route::patch('/user', [UserController::class, 'update']);

    Route::get('/organizations', [OrganizationController::class, 'index']);
    Route::post('/organizations', [OrganizationController::class, 'store']);
    Route::patch('/organizations/{organization}', [OrganizationController::class, 'update']);
    Route::get('/organizations/{organization}/reminder-rule', [ReminderRuleController::class, 'showForOrganization']);
    Route::put('/organizations/{organization}/reminder-rule', [ReminderRuleController::class, 'updateForOrganization']);

    Route::get('/organizations/{organization}/deadline-items', [DeadlineItemController::class, 'index']);
    Route::post('/organizations/{organization}/deadline-items', [DeadlineItemController::class, 'store']);
    Route::get('/deadline-items/{deadlineItem}', [DeadlineItemController::class, 'show']);
    Route::put('/deadline-items/{deadlineItem}', [DeadlineItemController::class, 'update']);
    Route::delete('/deadline-items/{deadlineItem}', [DeadlineItemController::class, 'destroy']);
    Route::post('/deadline-items/{deadlineItem}/mark-done', [DeadlineItemController::class, 'markDone']);
    Route::get('/deadline-items/{deadlineItem}/reminder-logs', [DeadlineItemController::class, 'reminderLogs']);
    Route::put('/deadline-items/{deadlineItem}/reminder-rule', [ReminderRuleController::class, 'updateForItem']);
    Route::delete('/deadline-items/{deadlineItem}/reminder-rule', [ReminderRuleController::class, 'destroyForItem']);
});
