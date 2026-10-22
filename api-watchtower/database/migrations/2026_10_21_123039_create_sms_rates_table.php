<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sms_rates', function (Blueprint $table) {
            $table->id();
            $table->string('country_iso2', 2);
            $table->enum('provider', ['kudi', 'termii']);
            $table->string('currency', 3)->default('NGN');
            $table->integer('rate_cents_per_sms')->default(0);
            $table->timestamp('effective_at')->useCurrent();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['country_iso2', 'provider', 'effective_at'], 'sms_rates_unique');
            $table->index(['country_iso2', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_rates');
    }
};
