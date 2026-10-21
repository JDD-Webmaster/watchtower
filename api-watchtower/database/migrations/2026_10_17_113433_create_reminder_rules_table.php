<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // One row per organization (the default) and, optionally, one row
        // per deadline item that wants to override it — exactly one of
        // organization_id/deadline_item_id is set per row, enforced in
        // ReminderRule::forOrganization()/forItem(), not at the DB level.
        // Absence of an item-level row means "use the org default", same
        // "absence = sensible default" shape as PlatformSetting in the
        // sibling UseLodger project.
        Schema::create('reminder_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('deadline_item_id')->nullable()->constrained()->cascadeOnDelete();
            // Days-before-due to send a reminder, e.g. [30,14,7,1].
            $table->json('offsets_days');
            // Once overdue, remind again every N days until marked done.
            $table->unsignedSmallInteger('overdue_repeat_days')->default(3);
            $table->timestamps();

            $table->unique('organization_id');
            $table->unique('deadline_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reminder_rules');
    }
};
