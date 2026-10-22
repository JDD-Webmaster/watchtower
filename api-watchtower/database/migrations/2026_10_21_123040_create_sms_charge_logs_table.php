<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sms_charge_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reminder_log_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('wallet_transaction_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider')->nullable();
            $table->string('country_iso2', 2)->nullable();
            $table->integer('cost_cents')->default(0);
            $table->string('status')->default('charged');
            $table->json('meta')->nullable();
            $table->timestamp('charged_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_charge_logs');
    }
};
