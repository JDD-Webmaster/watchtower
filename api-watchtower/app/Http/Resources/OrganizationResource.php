<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrganizationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'timezone' => $this->timezone,
            // Only present when loaded through $user->organizations() —
            // the pivot role for the current viewer.
            'role' => $this->whenPivotLoaded('organization_user', fn () => $this->pivot->role),
        ];
    }
}
