<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:150',
            'phone' => 'sometimes|nullable|string|max:30',
            'country' => 'sometimes|nullable|string|size:2',
            'timezone' => 'sometimes|nullable|timezone',
            'notification_preferences' => 'sometimes|array',
            'notification_preferences.email' => 'boolean',
            'notification_preferences.sms' => 'boolean',
        ]);

        $request->user()->update($data);

        return response()->json(['data' => new UserResource($request->user()->fresh())]);
    }
}
