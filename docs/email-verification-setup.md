# Email Verification Setup Guide

This guide explains how to set up email verification for your StudyCollab application after deployment.

## Overview

StudyCollab uses Supabase Auth for user authentication and email verification. After users register, they need to verify their email address to access all features.

## Supabase Configuration

### 1. Email Templates

In your Supabase dashboard:

1. Go to **Authentication** > **Email Templates**
2. Configure the **Confirm signup** template:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>

<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
```

### 2. URL Configuration

1. Go to **Authentication** > **URL Configuration**
2. Set your **Site URL** to your production domain: `https://yourdomain.com`
3. Add **Redirect URLs**:
   - `https://yourdomain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

### 3. Email Settings

1. Go to **Authentication** > **Settings**
2. Configure **SMTP Settings** (recommended for production):
   - **Enable custom SMTP**: Yes
   - **SMTP Host**: Your email provider's SMTP server
   - **SMTP Port**: Usually 587 or 465
   - **SMTP User**: Your email address
   - **SMTP Pass**: Your email password or app password
   - **SMTP Admin Email**: Your admin email address

Popular SMTP providers:

- **Gmail**: smtp.gmail.com:587
- **SendGrid**: smtp.sendgrid.net:587
- **Mailgun**: smtp.mailgun.org:587
- **AWS SES**: email-smtp.region.amazonaws.com:587

## Environment Variables

Make sure your `.env.local` file includes:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Email Verification Flow

### 1. User Registration

When a user signs up:

1. User fills out registration form
2. Account is created in Supabase
3. Verification email is sent automatically
4. User sees a message to check their email

### 2. Email Verification

When user clicks the verification link:

1. User is redirected to `/auth/callback`
2. The callback page exchanges the code for a session
3. User is redirected to the dashboard
4. Email is marked as verified

### 3. Resending Verification

If user doesn't receive the email:

1. User can click "Resend verification email" in their profile
2. API endpoint `/api/auth/resend-verification` sends a new email
3. User receives a new verification link

## Testing Email Verification

### Development Testing

1. Register a new account with a real email address
2. Check your email for the verification link
3. Click the link to verify
4. Confirm you're redirected to the dashboard

### Production Testing

1. Deploy your application
2. Update Supabase URL configuration
3. Test the complete flow with a real email
4. Monitor Supabase logs for any issues

## Troubleshooting

### Common Issues

**1. Verification emails not being sent**

- Check SMTP configuration in Supabase
- Verify email templates are configured
- Check spam/junk folders
- Monitor Supabase logs for errors

**2. Verification links not working**

- Ensure redirect URLs are correctly configured
- Check that `NEXT_PUBLIC_SITE_URL` matches your domain
- Verify the `/auth/callback` route is working

**3. Users stuck in unverified state**

- Check if email confirmation is required in Supabase settings
- Verify the resend verification endpoint is working
- Consider manually verifying users in Supabase dashboard if needed

### Debugging Steps

1. **Check Supabase Logs**:
   - Go to Supabase Dashboard > Logs
   - Look for authentication and email-related errors

2. **Test Email Delivery**:
   - Send a test email from Supabase dashboard
   - Check email provider logs if using custom SMTP

3. **Verify Configuration**:
   - Double-check all URLs and environment variables
   - Ensure production and development configs are correct

## Security Considerations

1. **Email Verification Required**: Always require email verification for production
2. **SMTP Security**: Use app passwords or API keys, not regular passwords
3. **URL Validation**: Ensure redirect URLs are properly configured
4. **Rate Limiting**: Consider implementing rate limiting for resend requests

## Production Deployment Checklist

- [ ] Configure custom SMTP in Supabase
- [ ] Set correct Site URL and Redirect URLs
- [ ] Update environment variables for production
- [ ] Test email verification flow
- [ ] Monitor email delivery rates
- [ ] Set up email provider monitoring/alerts

## Email Providers Comparison

| Provider | Pros                           | Cons                   | Cost                |
| -------- | ------------------------------ | ---------------------- | ------------------- |
| Gmail    | Easy setup, reliable           | Limited sending rate   | Free                |
| SendGrid | High deliverability, analytics | Requires account setup | Free tier available |
| Mailgun  | Developer-friendly, good APIs  | Complex pricing        | Pay-as-you-go       |
| AWS SES  | Scalable, integrated with AWS  | Requires AWS account   | Very low cost       |

## Support

If you encounter issues with email verification:

1. Check this documentation first
2. Review Supabase authentication documentation
3. Check the application logs and Supabase dashboard
4. Test with different email providers
5. Contact your email provider support if needed

Remember to test the entire email verification flow in a production-like environment before going live!
