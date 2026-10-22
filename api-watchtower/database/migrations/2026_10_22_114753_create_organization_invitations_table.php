<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organization_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('email');
            $table->enum('role', ['admin', 'member']);
            $table->boolean('can_receive_sms')->default(true);
            $table->boolean('can_receive_email')->default(true);
            $table->foreignId('invited_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('token', 64)->unique();
            $table->enum('status', ['pending', 'accepted', 'revoked'])->default('pending');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            // One live invite per email per org — re-inviting refreshes this
            // row (new token, updated role) instead of piling up duplicates.
            $table->unique(['organization_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_invitations');
    }
};
