<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ config('app.name') }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b;line-height:1.6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center" style="padding:40px 16px;">
                <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="background-color:#0f172a;padding:24px 32px;">
                            <span style="color:#ffffff;font-size:18px;font-weight:600;">{{ config('app.name') }}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <p style="font-size:16px;font-weight:600;color:#0f172a;margin:0 0 16px;">{{ $itemName }}</p>
                            <p style="font-size:14px;color:#3f3f46;margin:0 0 24px;">{{ $body }}</p>
                            <a href="{{ $link }}" style="display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:600;">View & mark done</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
