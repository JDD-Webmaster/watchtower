<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\OrganizationMember;
use App\Models\User;
use App\Services\Phone\PhoneNumberNormalizer;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

// Sanctum SPA cookie auth — the frontend hits GET /sanctum/csrf-cookie
// once, then these endpoints ride the normal session guard. No bearer
// tokens issued here; that's reserved for the future UseLodger-style
// API integration, not the browser session.
class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        // Someone registering to accept a team invite already has an
        // organization waiting for them — don't force them to also name
        // one of their own.
        $hasPendingInvite = OrganizationInvitation::where('email', $request->input('email'))
            ->where('status', 'pending')
            ->exists();

        $data = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            // A brand new user needs somewhere to put their first
            // deadline — create it alongside the account rather than
            // forcing a separate "create an organization" step first.
            'organization_name' => $hasPendingInvite ? 'nullable|string|max:150' : 'required|string|max:150',
            // Optional at signup — someone who skips it still gets an
            // account, just without SMS until they add one in Settings.
            'phone' => 'nullable|string|max:20',
            'country' => 'nullable|string|size:2',
        ]);

        $phone = null;
        $country = $data['country'] ?? null;

        if (! empty($data['phone'])) {
            $normalized = PhoneNumberNormalizer::normalize($data['phone'], $country);
            $phone = $normalized['phone'];
            $country = $normalized['country'];
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $phone,
            'country' => $country,
        ]);

        if (! empty($data['organization_name'])) {
            $organization = Organization::create(['name' => $data['organization_name']]);
            $organization->users()->attach($user->id, ['role' => 'owner']);
        }

        $this->redeemPendingInvitations($user);

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json(['data' => new UserResource($user->load('organizations'))], 201);
    }

    // Adds a brand-new user to every organization that invited their email
    // address before they signed up — no invite-link click required, since
    // registering with the invited address is itself the acceptance.
    private function redeemPendingInvitations(User $user): void
    {
        $invitations = OrganizationInvitation::where('email', $user->email)
            ->where('status', 'pending')
            ->get();

        foreach ($invitations as $invitation) {
            $organization = $invitation->organization;

            if (! $organization->users()->where('user_id', $user->id)->exists()) {
                $organization->users()->attach($user->id, ['role' => $invitation->role]);
                OrganizationMember::updateOrCreate(
                    ['organization_id' => $organization->id, 'user_id' => $user->id],
                    [
                        'role' => $invitation->role,
                        'can_receive_sms' => $invitation->can_receive_sms,
                        'can_receive_email' => $invitation->can_receive_email,
                        'joined_at' => now(),
                    ]
                );
            }

            $invitation->update(['status' => 'accepted', 'accepted_at' => now()]);
        }
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (! Auth::guard('web')->attempt($credentials)) {
            throw ValidationException::withMessages(['email' => 'Those credentials don\'t match an account.']);
        }

        $request->session()->regenerate();

        return response()->json(['data' => new UserResource(Auth::guard('web')->user()->load('organizations'))]);
    }

    public function logout(Request $request): JsonResponse
    {
        // Explicit 'web' guard, not the bare Auth:: facade — this route
        // sits behind auth:sanctum, where the request's resolved default
        // guard is Sanctum's RequestGuard (used for the stateless/token
        // case), which has no logout() method at all. The session itself
        // is still the 'web' guard underneath for an SPA cookie request.
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => new UserResource($request->user()->load('organizations'))]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        // Always return success to avoid user enumeration
        return response()->json(['message' => 'If an account exists with that email, you will receive a password reset link shortly.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->setRememberToken(Str::random(60));

                $user->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password reset successful. You can now sign in.']);
        }

        throw ValidationException::withMessages(['email' => [__($status)]]);
    }
}
