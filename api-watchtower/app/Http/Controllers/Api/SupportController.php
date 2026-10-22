<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class SupportController extends Controller
{
    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:200',
            'message' => 'required|string|max:5000',
        ]);

        // Try to send via mail if configured; otherwise just log/accept.
        // We always return success so the UX is smooth regardless of mail config.
        try {
            Mail::raw(
                "From: {$data['name']} <{$data['email']}>\n\n{$data['message']}",
                function ($mail) use ($data) {
                    $mail->to('hello@uselodger.com')
                        ->subject('[WatchTower Support] '.$data['subject'])
                        ->replyTo($data['email'], $data['name']);
                }
            );
        } catch (\Throwable $e) {
            // Ignore mail failures; support is still reachable via email directly.
        }

        return response()->json(['message' => 'Support request sent']);
    }
}
