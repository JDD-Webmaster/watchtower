<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deadline_item_notification_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deadline_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // No column-level default: MySQL rejects DEFAULT on JSON
            // columns (error 1101). The model supplies the default in
            // PHP instead — see DeadlineItemNotificationTarget::$attributes.
            $table->json('channels');
            $table->timestamps();
            // Explicit short name: MySQL caps identifiers at 64 chars and
            // the auto-generated name for this pair is 66.
            $table->unique(['deadline_item_id', 'user_id'], 'deadline_item_targets_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deadline_item_notification_targets');
    }
};
