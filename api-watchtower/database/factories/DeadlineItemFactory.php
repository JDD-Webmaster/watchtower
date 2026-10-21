<?php

namespace Database\Factories;

use App\Models\DeadlineItem;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DeadlineItem>
 */
class DeadlineItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'organization_id' => Organization::factory(),
            'name' => fake()->words(3, true),
            'category' => fake()->randomElement(['Domain', 'Hosting', 'API/Payment Subscription', 'Government Levy']),
            'due_date' => now()->addDays(30)->toDateString(),
            'recurrence' => 'none',
            'owner_user_id' => User::factory(),
            // status is not fillable (see DeadlineItem) — DB column
            // default ('upcoming') applies regardless of what's passed
            // here; use DeadlineItem::query()->update() in a test if a
            // specific status is actually needed.
            'is_active' => true,
        ];
    }
}
