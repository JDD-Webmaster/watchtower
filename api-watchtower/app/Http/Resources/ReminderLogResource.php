<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReminderLogResource extends JsonResource
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
            'channel' => $this->channel,
            'content' => $this->content,
            'sent_at' => $this->sent_at->toIso8601String(),
            'success' => $this->success,
            'error' => $this->error,
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
