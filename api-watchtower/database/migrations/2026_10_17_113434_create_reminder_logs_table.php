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
        Schema::create('reminder_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deadline_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('channel', ['sms', 'email']);
            // Exact rendered text that was sent, not just a template
            // reference — lets a human audit precisely what went out,
            // same reasoning as LeadOutreachLog::content in UseLodger.
            $table->text('content');
            $table->timestamp('sent_at');
            $table->boolean('success');
            $table->string('error')->nullable();
            $table->timestamps();

            $table->index(['deadline_item_id', 'sent_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reminder_logs');
    }
};
