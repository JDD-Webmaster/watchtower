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
        Schema::create('deadline_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            // Free text, not an enum — government levies and "other"
            // vary completely by jurisdiction/business, a closed list
            // would make this useless for most of them. Frontend offers
            // suggested presets (Domain, Hosting, API/Payment
            // Subscription, Government Levy) but never enforces them.
            $table->string('category')->nullable();
            $table->text('notes')->nullable();
            $table->date('due_date');
            $table->enum('recurrence', ['none', 'monthly', 'quarterly', 'yearly', 'custom_days'])->default('none');
            $table->unsignedSmallInteger('recurrence_interval_days')->nullable();
            $table->foreignId('owner_user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['upcoming', 'overdue', 'done'])->default('upcoming');
            $table->timestamp('last_completed_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['organization_id', 'is_active', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deadline_items');
    }
};
