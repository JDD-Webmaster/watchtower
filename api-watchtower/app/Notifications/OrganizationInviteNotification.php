<?php

namespace App\Notifications;

use App\Models\OrganizationInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrganizationInviteNotification extends Notification
{
    use Queueable;

    public function __construct(public OrganizationInvitation $invitation) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');
        $org = $this->invitation->organization;
        $inviter = $this->invitation->invitedBy;

        $url = "{$frontendUrl}/register?invite={$this->invitation->token}&email=".urlencode($this->invitation->email);

        $greeting = $inviter
            ? "{$inviter->name} has invited you to join {$org->name} on WatchTower."
            : "You've been invited to join {$org->name} on WatchTower.";

        return (new MailMessage)
            ->subject("You're invited to join {$org->name} on WatchTower")
            ->greeting('Hello,')
            ->line($greeting)
            ->line('WatchTower tracks renewal and compliance deadlines and nags by SMS and email before they slip.')
            ->action('Accept invitation', $url)
            ->line('Create your account with this email address and you\'ll be added to the organization automatically.');
    }
}
