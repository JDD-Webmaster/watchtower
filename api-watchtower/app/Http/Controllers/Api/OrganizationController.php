<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrganizationResource;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => OrganizationResource::collection($request->user()->organizations),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'timezone' => 'nullable|timezone',
        ]);

        $organization = Organization::create($data);
        $organization->users()->attach($request->user()->id, ['role' => 'owner']);

        return response()->json(['data' => new OrganizationResource($organization)], 201);
    }

    public function update(Request $request, Organization $organization): JsonResponse
    {
        $this->authorize('update', $organization);

        $data = $request->validate([
            'name' => 'sometimes|string|max:150',
            'timezone' => 'sometimes|timezone',
        ]);

        $organization->update($data);

        return response()->json(['data' => new OrganizationResource($organization)]);
    }
}
