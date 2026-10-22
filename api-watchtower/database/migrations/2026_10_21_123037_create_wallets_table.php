<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('currency', 3)->default('NGN');
            $table->bigInteger('balance_cents')->default(0);
            $table->bigInteger('available_cents')->default(0);
            $table->bigInteger('held_cents')->default(0);
            $table->enum('status', ['active', 'suspended'])->default('active');
            $table->timestamps();
            $table->unique(['organization_id', 'currency']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallets');
    }
};
