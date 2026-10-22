<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['credit', 'debit', 'hold', 'release', 'refund', 'adjustment']);
            $table->bigInteger('amount_cents');
            $table->bigInteger('fee_cents')->default(0);
            $table->bigInteger('net_cents');
            $table->string('reason');
            $table->string('reference')->nullable()->unique();
            $table->string('idempotency_key')->nullable()->index();
            $table->json('meta')->nullable();
            $table->bigInteger('balance_after_cents')->nullable();
            $table->timestamps();
            $table->index(['wallet_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
