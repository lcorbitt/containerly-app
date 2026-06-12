# Supabase Auth email templates

HTML templates for **Supabase Auth** emails (team invites, password reset, magic links, etc.). They match the branded layout in `supabase/functions/_services/email/email.service.ts` (`buildBrandedEmailHtml`).

## Local development

Configured in `supabase/config.toml` under `[auth.email.template.*]`. After changing templates or subjects:

```bash
supabase stop && supabase start
```

Preview in Mailpit at [http://127.0.0.1:54324](http://127.0.0.1:54324) — trigger an invite from Settings → Organization or `/admin/invites`, or use Forgot Password on `/login`.

## Hosted projects (production / staging)

Supabase CLI does not deploy these files automatically. For each template in the Dashboard (**Authentication → Email Templates**), copy the matching HTML file and subject line from this folder:

| File | Dashboard template | Subject (config.toml) |
|------|-------------------|------------------------|
| `invite.html` | Invite user | You've been invited to Containerly |
| `recovery.html` | Reset password | Reset your Containerly password |
| `magic_link.html` | Magic link | Sign in to Containerly |
| `confirmation.html` | Confirm signup | Confirm your Containerly email address |
| `email_change.html` | Change email address | Confirm your new Containerly email address |
| `reauthentication.html` | Reauthentication | Your Containerly verification code |

Template variables: `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`, `{{ .Email }}`, `{{ .Token }}`, `{{ .NewEmail }}` — [Supabase docs](https://supabase.com/docs/guides/local-development/customizing-email-templates#template-variables).

Ensure **Site URL** in Dashboard → Authentication → URL Configuration matches your app origin so the logo (`{{ .SiteURL }}/containerly-logo.png`) loads correctly.

Password-change confirmations are sent separately via Resend (`notify-password-changed` Edge function), not these Auth templates.
