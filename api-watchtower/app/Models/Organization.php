<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

#[Fillable(['name', 'slug', 'timezone'])]
class Organization extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (Organization $organization) {
            if (! $organization->slug) {
                $organization->slug = static::uniqueSlug($organization->name);
            }
        });
    }

    private static function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'organization';
        $slug = $base;
        $suffix = 2;

        while (static::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->using(OrganizationUser::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    public function deadlineItems(): HasMany
    {
        return $this->hasMany(DeadlineItem::class);
    }

    public function reminderRule(): HasOne
    {
        return $this->hasOne(ReminderRule::class);
    }
}
