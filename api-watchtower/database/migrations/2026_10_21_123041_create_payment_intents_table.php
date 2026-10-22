<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_intents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->enum('provider', ['paystack', 'stripe']);
            $table->string('reference')->unique();
            $table->bigInteger('amount_cents');
            $table->string('currency', 3)->default('NGN');
            $table->enum('status', ['pending', 'succeeded', 'failed', 'refunded', 'cancelled'])->default('pending');
            $table->json('metadata')->nullable();
            $table->timestamp('webhook_received_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_intents');
    }
};
