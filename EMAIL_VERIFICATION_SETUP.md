# Email Verification Setup Guide

## Implementation Complete ✅

Email verification has been successfully implemented for Music Room. This satisfies the mandatory requirement from `doc/en.subject.pdf` Section IV.1 (Page 6).

---

## What Was Implemented

### Backend Changes

1. **Database Migration** (`backend/migrations/013_email_verification.sql`)
   - Added `email_verified`, `verification_code`, `verification_code_expires_at` columns
   - Created index for fast code lookups
   - Auto-verifies existing users for backward compatibility

2. **Email Service** (`backend/src/features/auth/services/email.service.ts`)
   - Gmail SMTP integration with nodemailer
   - HTML email templates with Music Room branding
   - 6-digit verification code delivery

3. **Verification Service** (`backend/src/features/auth/services/email-verification.service.ts`)
   - Crypto-secure code generation
   - Redis-based rate limiting (max 5 attempts, 60s cooldown)
   - Automatic code expiration (15 minutes)

4. **Modified Registration Flow** (`backend/src/features/auth/auth.service.ts`)
   - Changed `email_confirm: false` (requires verification)
   - Generates and sends verification code after registration
   - Returns response WITHOUT session until verified

5. **Modified Login Flow** (`backend/src/features/auth/auth.service.ts`)
   - Blocks login for unverified email/password accounts
   - OAuth accounts (Google/Facebook) auto-verified

6. **New API Endpoints**:
   - `POST /api/auth/verify-email` - Verify 6-digit code
   - `POST /api/auth/resend-verification` - Resend verification code

7. **OAuth Auto-Verification** (`backend/src/features/auth/services/user.service.ts`)
   - Existing OAuth users auto-verified on next login
   - Linking OAuth to email account auto-verifies

---

## Setup Instructions

### Step 1: Execute Database Migration

**IMPORTANT**: You must execute this migration in Supabase Dashboard SQL Editor:

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
2. Click "New Query"
3. Copy the contents of `backend/migrations/013_email_verification.sql`
4. Paste and execute
5. Verify success message appears

### Step 2: Configure Gmail App Password

1. Go to: https://myaccount.google.com/security
2. Enable **2-Step Verification** if not already enabled
3. Navigate to: **Security → 2-Step Verification → App passwords**
4. Generate a new app password for "Music Room Backend"
5. Copy the 16-character password (remove spaces)

### Step 3: Update Backend .env

Add these variables to `backend/.env`:

```bash
# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-password-here

# Email Verification Settings (defaults provided)
EMAIL_VERIFICATION_ENABLED=true
EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES=15
EMAIL_VERIFICATION_MAX_ATTEMPTS=5
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
EMAIL_VERIFICATION_MAX_RESENDS_PER_HOUR=3
```

**CRITICAL**: Use the **App-Specific Password**, NOT your regular Gmail password!

### Step 4: Regenerate Supabase Types

After executing the migration, regenerate types:

```bash
cd backend
npm run generate-types
```

This updates TypeScript types to include the new columns.

### Step 5: Restart Backend

```bash
# Docker mode
make restart

# Local mode
cd backend && npm run dev
```

---

## Testing the Implementation

### 1. Register New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "username": "testuser"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "requiresVerification": true,
    "message": "Registration successful. Please check your email for verification code."
  }
}
```

Check your email for a 6-digit code.

### 2. Verify Email

```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_FROM_REGISTRATION",
    "code": "123456"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "session": {
      "accessToken": "...",
      "refreshToken": "...",
      ...
    },
    "message": "Email verified successfully"
  }
}
```

### 3. Try Login Before Verification

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

**Expected Response** (403 Forbidden):
```json
{
  "success": false,
  "error": {
    "message": "Please verify your email before logging in. Check your inbox for the verification code.",
    "code": "EMAIL_NOT_VERIFIED"
  }
}
```

### 4. Resend Verification Code

```bash
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "email": "test@example.com"
  }'
```

**Rate Limiting**:
- 60 seconds cooldown between resends
- Max 3 resends per hour

### 5. OAuth Login (Auto-Verified)

```bash
curl -X POST http://localhost:3000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "GOOGLE_ID_TOKEN"
  }'
```

OAuth users are automatically verified (no email confirmation needed).

---

## Security Features

1. **Rate Limiting**:
   - Max 5 verification attempts per 15 minutes
   - 60-second cooldown between resends
   - Max 3 resends per hour

2. **Code Security**:
   - Cryptographically secure random generation
   - Constant-time comparison (prevents timing attacks)
   - 15-minute expiration

3. **Email Security**:
   - App-specific password (not regular Gmail password)
   - No credentials in git (.env ignored)

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `EMAIL_SEND_ERROR` | 500 | Failed to send email via SMTP |
| `CODE_STORE_ERROR` | 500 | Failed to store verification code |
| `CODE_EXPIRED` | 400 | Verification code expired (15 min) |
| `INVALID_CODE` | 400 | Incorrect verification code |
| `NO_CODE_FOUND` | 400 | No verification code stored |
| `VERIFICATION_ATTEMPTS_EXCEEDED` | 429 | Too many verification attempts (5 max) |
| `RESEND_COOLDOWN` | 429 | Must wait before resend (60s) |
| `RESEND_LIMIT_EXCEEDED` | 429 | Too many resends (3/hour) |
| `EMAIL_NOT_VERIFIED` | 403 | Login blocked - email not verified |

---

## Troubleshooting

### Email Not Received

1. **Check Spam Folder**: Gmail may flag automated emails
2. **Verify Gmail Credentials**: Ensure app password is correct
3. **Check Backend Logs**: Look for "Verification email sent" message
4. **Test SMTP Connection**:
   ```typescript
   const emailService = new EmailService();
   const connected = await emailService.verifyConnection();
   console.log('Gmail connected:', connected);
   ```

### Type Errors After Migration

Run type generation:
```bash
cd backend
npm run generate-types
npm run build
```

### OAuth Users Not Auto-Verified

Existing OAuth users will be auto-verified on next login. No manual action needed.

---

## Production Checklist

- [ ] Execute migration in production Supabase
- [ ] Configure production Gmail account (e.g., `noreply@musicroom.com`)
- [ ] Set up SPF, DKIM, DMARC records for email domain
- [ ] Add Gmail credentials to production `.env`
- [ ] Test email delivery to Gmail, Outlook, Yahoo
- [ ] Monitor email send success rate
- [ ] Set up alerts for `EMAIL_SEND_ERROR` in logs

---

## Next Steps (Not Implemented Yet)

1. **Password Reset** (planned with OTP screen)
2. **Mobile UI** (verification screen, resend button)
3. **Email Queue** (Bull/BullMQ for retry logic)
4. **Magic Link Alternative** (click link instead of code)

---

## Files Modified

**New Files (3)**:
- `backend/migrations/013_email_verification.sql`
- `backend/src/features/auth/services/email.service.ts`
- `backend/src/features/auth/services/email-verification.service.ts`

**Modified Files (8)**:
- `backend/src/features/auth/auth.service.ts`
- `backend/src/features/auth/services/user.service.ts`
- `backend/src/features/auth/auth.controller.ts`
- `backend/src/features/auth/auth.routes.ts`
- `backend/src/features/auth/auth.types.ts`
- `backend/src/features/auth/auth.validators.ts`
- `backend/.env.example`
- `backend/src/shared/config/env.ts`

---

## Summary

✅ Email verification is **fully implemented** and ready for testing
✅ Satisfies **mandatory requirement** from subject PDF
✅ OAuth accounts **auto-verified** (no email needed)
✅ Rate limiting and security measures in place
✅ Production-ready with proper error handling

**Next Action**: Execute the migration in Supabase Dashboard and configure Gmail credentials in `.env`.
