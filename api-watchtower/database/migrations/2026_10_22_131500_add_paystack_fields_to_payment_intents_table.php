<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_intents', function (Blueprint $table) {
            $table->string('access_code')->nullable()->after('reference');
            $table->text('authorization_url')->nullable()->after('access_code');
            $table->timestamp('paid_at')->nullable()->after('webhook_received_at');
        });
    }

    public function down(): void
    {
        Schema::table('payment_intents', function (Blueprint $table) {
            $table->dropColumn(['access_code', 'authorization_url', 'paid_at']);
        });
    }
};
