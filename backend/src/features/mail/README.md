# Mail Feature

**Status**: ✅ Active
**Purpose**: Send transactional emails with template support and rate limiting

The mail feature provides a reusable, extensible email service for Music Room. It decouples email sending logic from specific features and supports multiple email types through a template registry system.

---

## Architecture

```
features/mail/
├── services/
│   ├── mail.service.ts              # Main email sending service (Gmail SMTP)
│   ├── rate-limiter.service.ts      # Generic rate limiting (Redis + in-memory)
│   └── template-renderer.service.ts # Template registry and rendering
├── templates/
│   ├── base.template.ts             # Base HTML layout (dark theme, Music Room branding)
│   └── verification-email.template.ts # Verification email template
├── utils/
│   └── mail.helpers.ts              # Helper functions (validation, formatting)
├── mail.types.ts                    # TypeScript types
├── mail.config.ts                   # Configuration (Gmail SMTP, verification settings)
└── README.md                        # This file
```

---

## Core Services

### 1. MailService

Main service for sending emails via Gmail SMTP.

**Methods**:
- `sendTemplatedEmail(to, templateName, data)` - Send email using a template
- `sendEmail(options)` - Send email with custom HTML/text content
- `verifyConnection()` - Health check for SMTP connection
- `getAvailableTemplates()` - List all registered templates

**Example Usage**:
```typescript
import { MailService } from '@features/mail/services/mail.service.js';

const mailService = new MailService();

// Send templated email
await mailService.sendTemplatedEmail(
  'user@example.com',
  'verification-email',
  { code: '123456', expiresInMinutes: 15 }
);

// Send custom email
await mailService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to Music Room',
  html: '<p>Welcome!</p>',
  text: 'Welcome!'
});
```

### 2. RateLimiterService

Generic rate limiting service using Redis (with in-memory fallback).

**Methods**:
- `checkLimit(key, config)` - Check if action is within rate limit
- `incrementAndCheck(key, config)` - Increment counter and check (throws on exceed)
- `increment(key, config)` - Increment counter without throwing
- `reset(key)` - Reset rate limit for a key
- `getAttempts(key)` - Get current attempt count

**Example Usage**:
```typescript
import { RateLimiterService } from '@features/mail/services/rate-limiter.service.js';

const rateLimiter = new RateLimiterService();

// Check rate limit
const result = await rateLimiter.checkLimit('email:verify:userId:ip', {
  maxAttempts: 5,
  windowSeconds: 900 // 15 minutes
});

if (!result.canProceed) {
  console.log(`Rate limited. Wait ${result.remainingSeconds}s`);
}

// Increment and check (throws AppError if exceeded)
await rateLimiter.incrementAndCheck('api:call:userId', {
  maxAttempts: 100,
  windowSeconds: 3600 // 1 hour
});
```

### 3. TemplateRendererService

Registry and orchestrator for email templates.

**Methods**:
- `render(templateName, data)` - Render a template by name
- `hasTemplate(templateName)` - Check if template exists
- `getAvailableTemplates()` - List all registered templates
- `registerTemplate(name, renderer)` - Register a new template

**Example Usage**:
```typescript
import { TemplateRendererService } from '@features/mail/services/template-renderer.service.js';

const renderer = new TemplateRendererService();

// Render template
const emailTemplate = renderer.render('verification-email', {
  code: '123456',
  expiresInMinutes: 15
});

console.log(emailTemplate.subject); // "Verify Your Music Room Account"
console.log(emailTemplate.html);    // HTML version
console.log(emailTemplate.text);    // Plain text version
```

---

## Available Templates

### verification-email

Sends a 6-digit verification code to verify user email addresses.

**Data**:
- `code` (string) - 6-digit verification code
- `expiresInMinutes` (number) - Code expiration time in minutes

**Subject**: "Verify Your Music Room Account"

**Visual Design**:
- Dark theme matching Music Room app (#121212 background, #1DB954 green accent)
- Large monospace code display with green background
- Responsive design for mobile and desktop
- Plain text fallback version

---

## Configuration

Configuration is centralized in `mail.config.ts` and loaded from environment variables.

### Environment Variables

```bash
# Gmail SMTP (required)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # 16-char app password from Google

# Email Verification
EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES=15      # Code expiration (default: 15)
EMAIL_VERIFICATION_MAX_ATTEMPTS=5              # Max verify attempts (default: 5)
EMAIL_VERIFICATION_MAX_RESENDS_PER_HOUR=3      # Max resends per hour (default: 3)
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=60  # Cooldown between resends (default: 60)
```

### Gmail Setup

1. Enable 2-factor authentication on your Google account
2. Go to [Google Account > Security > App passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail" on "Other (Custom name)"
4. Copy the 16-character password to `GMAIL_APP_PASSWORD` in `.env`

---

## Adding New Email Templates

### Step 1: Create Template File

Create a new template in `templates/` directory:

```typescript
// templates/password-reset.template.ts
import { EmailTemplate } from "../mail.types.js";
import { colors, renderBaseTemplate, renderTextFooter } from "./base.template.js";

export interface PasswordResetData {
  resetLink: string;
  expiresInHours: number;
}

export function renderPasswordResetEmail(
  data: PasswordResetData
): EmailTemplate {
  const { resetLink, expiresInHours } = data;

  const content = `
    <h2 class="title">Reset Your Password</h2>
    <p class="description">
      Click the button below to reset your password:
    </p>
    <a href="${resetLink}" style="background: ${colors.primary}; ...">
      Reset Password
    </a>
    <p class="warning">
      This link expires in ${expiresInHours} hours.
    </p>
  `;

  return {
    subject: "Reset Your Music Room Password",
    html: renderBaseTemplate(content, "Reset Password"),
    text: `Reset your password: ${resetLink}\n\nExpires in ${expiresInHours} hours.\n\n${renderTextFooter()}`
  };
}
```

### Step 2: Register Template

Update `mail.types.ts` to add the new template name:

```typescript
export type TemplateName = "verification-email" | "password-reset";

export interface PasswordResetData extends TemplateData {
  resetLink: string;
  expiresInHours: number;
}
```

Update `template-renderer.service.ts` to register the template:

```typescript
import { renderPasswordResetEmail } from "../templates/password-reset.template.js";

private readonly templates: Map<TemplateName, TemplateRenderer<TemplateData>> = new Map([
  ["verification-email", renderVerificationEmail as TemplateRenderer<TemplateData>],
  ["password-reset", renderPasswordResetEmail as TemplateRenderer<TemplateData>],
]);
```

### Step 3: Use Template

```typescript
await mailService.sendTemplatedEmail(
  user.email,
  'password-reset',
  { resetLink: 'https://...', expiresInHours: 24 }
);
```

---

## Integration with Other Features

### Auth Feature

The auth feature uses the mail service for email verification:

```typescript
// In EmailVerificationService (auth feature)
import { MailService } from '@features/mail/services/mail.service.js';
import { RateLimiterService } from '@features/mail/services/rate-limiter.service.js';

class EmailVerificationService {
  private mailService = new MailService();
  private rateLimiter = new RateLimiterService();

  async sendVerificationEmail(email: string, code: string) {
    await this.mailService.sendTemplatedEmail(email, 'verification-email', {
      code,
      expiresInMinutes: this.CODE_EXPIRY_MINUTES
    });
  }
}
```

### Future Features

**Password Reset** (planned):
- Add `password-reset` template
- Use `MailService.sendTemplatedEmail()` with reset link
- Use `RateLimiterService` to prevent abuse

**Notifications** (planned):
- Add templates for playlist invites, friend requests, etc.
- Use `MailService` for transactional emails
- Use `RateLimiterService` to prevent spam

---

## Design Principles

### 1. Feature-First Architecture

The mail feature is fully self-contained and can be used by any feature in the backend. It follows the project's feature-first architecture pattern.

### 2. Separation of Concerns

- **MailService**: SMTP transport and email sending
- **RateLimiterService**: Rate limiting logic (reusable for any feature)
- **TemplateRendererService**: Template registry and rendering
- **Templates**: HTML/text content generation

### 3. Extensibility

- Add new templates without modifying existing code
- Template registry pattern for easy registration
- Base template provides consistent branding across all emails

### 4. Resilience

- In-memory fallback when Redis is unavailable
- Comprehensive error handling with AppError
- Logging for debugging and monitoring

### 5. Type Safety

- Full TypeScript support
- Template data validated at compile time
- Type-safe template names via union types

---

## Error Handling

The mail service uses `AppError` from `shared/middleware/error-handler.ts` for consistent error responses.

**Common Errors**:

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `EMAIL_SEND_ERROR` | Failed to send email via SMTP | 500 |
| `TEMPLATE_NOT_FOUND` | Invalid template name | 500 |
| `RATE_LIMIT_EXCEEDED` | Too many attempts | 429 |

**Example**:
```typescript
try {
  await mailService.sendTemplatedEmail(email, 'verification-email', data);
} catch (error) {
  if (error instanceof AppError && error.errorCode === 'RATE_LIMIT_EXCEEDED') {
    // Handle rate limit
  }
}
```

---

## Testing

### Manual Testing

```bash
# Start backend
cd backend
npm run dev

# Test SMTP connection
curl http://localhost:3000/health
# Look for "Gmail SMTP connection verified successfully" in logs

# Test email sending (via auth registration)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","username":"testuser"}'

# Check email inbox for verification code
```

### Unit Tests (Future)

```typescript
// Example test structure
describe('MailService', () => {
  it('should send templated email', async () => {
    const mailService = new MailService();
    await expect(
      mailService.sendTemplatedEmail('test@example.com', 'verification-email', {
        code: '123456',
        expiresInMinutes: 15
      })
    ).resolves.not.toThrow();
  });
});
```

---

## Performance Considerations

### Rate Limiting

- **Redis**: Fast, persistent rate limiting across server restarts
- **In-memory fallback**: Prevents feature degradation when Redis unavailable
- **Automatic cleanup**: Expired entries removed from in-memory store

### Caching

Currently no caching of rendered templates (templates are lightweight). If needed in the future:
- Cache rendered templates with TTL
- Invalidate cache on template updates

### Async Sending

Emails are sent synchronously (await). For high-volume scenarios, consider:
- Queue-based system (Bull, BullMQ)
- Background workers
- Email service providers with APIs (SendGrid, AWS SES)

---

## Troubleshooting

### Email Not Sending

**Issue**: Email fails to send, logs show "Failed to send email"

**Solutions**:
1. Verify Gmail credentials in `.env`:
   ```bash
   echo $GMAIL_USER
   echo $GMAIL_APP_PASSWORD
   ```
2. Check Gmail account settings:
   - 2FA must be enabled
   - App password must be valid (16 chars, no spaces)
3. Check SMTP connection:
   ```typescript
   const mailService = new MailService();
   const isConnected = await mailService.verifyConnection();
   console.log('SMTP connected:', isConnected);
   ```
4. Check firewall/network:
   - Gmail SMTP uses port 465 (SSL) or 587 (TLS)
   - Ensure port is not blocked

### Rate Limiting Too Strict

**Issue**: Users complaining about "Too many attempts" errors

**Solutions**:
1. Adjust rate limit config in `.env`:
   ```bash
   EMAIL_VERIFICATION_MAX_ATTEMPTS=10  # Increase from 5
   EMAIL_VERIFICATION_MAX_RESENDS_PER_HOUR=5  # Increase from 3
   ```
2. Reset rate limit for specific user:
   ```typescript
   const rateLimiter = new RateLimiterService();
   await rateLimiter.reset('email_verify_attempts:userId:ip');
   ```

### Redis Connection Issues

**Issue**: Rate limiting not working, logs show Redis errors

**Solutions**:
1. Check Redis status:
   ```bash
   docker ps | grep redis
   redis-cli ping
   ```
2. Verify Redis config in `shared/config/redis.ts`
3. Fallback to in-memory (automatic, but not persistent across restarts)

---

## Future Enhancements

### Planned Features

- [ ] **Password Reset Email** - Template for password reset flows
- [ ] **Email Queue System** - Async email sending with Bull/BullMQ
- [ ] **Email Analytics** - Track open rates, click rates
- [ ] **Multi-Provider Support** - Abstract SMTP to support SendGrid, AWS SES, etc.
- [ ] **Email Preferences** - User opt-in/opt-out for notification emails
- [ ] **Email Localization** - Multi-language template support
- [ ] **Template Testing UI** - Preview templates in browser before sending

### Architecture Improvements

- [ ] **Dependency Injection** - Use DI container for service instantiation
- [ ] **Unit Tests** - Comprehensive test coverage with mocks
- [ ] **Integration Tests** - E2E email sending tests
- [ ] **Email Validation** - Stricter email format validation
- [ ] **Attachment Support** - Send files, images, PDFs

---

## Related Documentation

- **Backend Architecture**: `/CLAUDE.md` (see "Backend: Feature-First Architecture")
- **Auth Feature**: `/backend/src/features/auth/` (uses mail service for verification)
- **Environment Configuration**: `/backend/.env.example`
- **Error Handling**: `/backend/src/shared/middleware/error-handler.ts`

---

## Contact

For questions or issues with the mail feature, see:
- Project Documentation: `/CLAUDE.md`
- Backend README: `/backend/README.md`
- Issue Tracker: [GitHub Issues](https://github.com/Elnop/Music_Room/issues)
