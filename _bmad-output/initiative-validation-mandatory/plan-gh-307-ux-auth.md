---
title: 'Irritants UX de l''authentification (#307, groupe « Authentification »)'
type: 'bugfix'
ticket: 'https://github.com/Elnop/music-room/issues/307'
created: '2026-10-17'
status: 'built'
baseline_revision: '7e35768dfedd45f43b0948364284337a05b30391'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Audit #307, section « Authentification »:
- On Register, the Facebook button sits under the gesture navigation bar.
- No password field lets the user see what they typed.
- A pasted or keyboard-suggested 6-digit code fills only the first box (Verify Email, Reset Password).
- The keyboard stays open on the home screen after email verification.
- Forgot/Reset Password offer three ways back, and the email typed on Login is not carried over.
- The Welcome « Server settings » link (story 6.3, #96) is a large text link shown to everyone.

**Approach:** One fix per irritant, in the shared pieces where possible:
- `Input` gets a show/hide eye button on every `secureTextEntry` field.
- A shared helper spreads typed or pasted digits over the six boxes, and the first box declares itself as a one-time code field.
- The keyboard is dismissed when verification is submitted.
- The in-content « ← Back » goes from Forgot and Reset; the email moves from Login to Forgot.
- Register's scroll content gets the bottom safe-area inset.
- The server link stays in every build but becomes a small gear icon, read as « Serveur » by the screen reader (user's decision, 2026-10-17).

## Boundaries & Constraints

**Always:** New UI text in French with the formal register (#341). Existing English labels stay untouched: #341 translates them. Every `secureTextEntry` field in the app gets the toggle through `Input`, not per screen. Typing digit by digit keeps working as today, including backspace moving to the previous box.

**Never:** Translating the auth screens (that is #341). Removing the server settings or hiding them in release builds. Changing auth logic or the store.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Paste full code | « 123456 » pasted or autofilled in any box | All six boxes filled; Verify Email submits as today | No error expected |
| Partial paste | « 12 » in box 3 | Boxes 3–4 filled, focus on box 5 | No error expected |
| Non-digits | « 12a4 » or a letter typed | Non-digits dropped; a lone letter changes nothing | No error expected |
| Paste with spaces | « 123 456 » | Six boxes filled | No error expected |
| Over-long paste | « 1234567 » in box 1 | First six digits used | No error expected |
| Password toggle | Eye pressed on a password field | Text shown, icon flips, label « Masquer le mot de passe »; pressed again, hidden | No error expected |

</frozen-after-approval>

## Code Map

- `mobile/src/components/common/Input.tsx` -- shared field; `secureTextEntry` is passed straight to `TextInput`. Add internal hidden state and a right-hand `Pressable` eye (Ionicons `eye-outline`/`eye-off-outline`), only when `secureTextEntry` is set. Tests in `Input.test.tsx`.
- `mobile/src/utils/` -- new `codeDigits.ts` (+ test): pure `fillCodeDigits(code, index, text)` returning the new array and the box to focus, or null for a no-op.
- `mobile/src/screens/auth/EmailVerificationScreen.tsx` -- `handleCodeChange` (l.40) rejects anything but one digit; boxes use `maxLength={1}` (l.118). Uses `fillCodeDigits`; `Keyboard.dismiss()` at the start of `handleVerify` (l.65) before the store logs the user in.
- `mobile/src/screens/auth/ResetPasswordScreen.tsx` -- same box logic (`handleCodeChange` l.63, boxes ~l.192); drop the « ← Back » touchable (l.172) and its styles.
- `mobile/src/screens/auth/ForgotPasswordScreen.tsx` -- drop « ← Back » (l.62); initial `email` from `route.params?.email`. The footer « Log In » link stays.
- `mobile/src/navigation/AuthNavigator.tsx` -- `ForgotPassword: { email?: string } | undefined`.
- `mobile/src/screens/auth/LoginScreen.tsx` -- `navigate('ForgotPassword')` (l.183) passes the form's current email (`getValues('email')` from `useForm`, l.27).
- `mobile/src/screens/auth/RegisterScreen.tsx` -- `scrollContent` (l.230) has no bottom padding; add `useSafeAreaInsets().bottom`.
- `mobile/src/screens/auth/WelcomeScreen.tsx` -- the toggle at l.204–217 shows text; replace it with a `settings-outline` icon button (`accessibilityLabel` « Serveur », state in `accessibilityState.expanded`). `BackendUrlField` panel unchanged.

## Tasks & Acceptance

**Execution:**
- [x] `mobile/src/utils/codeDigits.ts` + test -- helper covering the I/O matrix -- one place for both screens.
- [x] `mobile/src/screens/auth/EmailVerificationScreen.tsx` -- use the helper; `maxLength={6}`; first box `autoComplete="sms-otp"` and `textContentType="oneTimeCode"`; `Keyboard.dismiss()` on submit.
- [x] `mobile/src/screens/auth/ResetPasswordScreen.tsx` -- same box changes; remove « ← Back ».
- [x] `mobile/src/components/common/Input.tsx` + test -- password eye toggle.
- [x] `mobile/src/navigation/AuthNavigator.tsx`, `LoginScreen.tsx`, `ForgotPasswordScreen.tsx` -- email carried over; remove « ← Back ».
- [x] `mobile/src/screens/auth/RegisterScreen.tsx` -- bottom inset.
- [x] `mobile/src/screens/auth/WelcomeScreen.tsx` -- gear icon toggle.

**Acceptance Criteria:**
- Given an email typed on Login, when « Forgot password » is tapped, then the Forgot screen opens with that email filled in.
- Given Forgot or Reset Password, when the screen shows, then the only ways back are the header arrow and, on Forgot, the « Log In » footer link.
- Given a gesture-navigation phone, when Register is scrolled to the bottom, then the Facebook button sits fully above the navigation bar.
- Given a correct code, when verification succeeds, then the home screen shows with the keyboard closed.
- Given the Welcome screen, when it shows, then a small gear (not a text link) opens and closes the server panel.

## Verification

**Commands:**
- `cd mobile && npm test && npm run type-check && npm run lint` -- expected: all pass, no new lint error.

**Manual checks (if no CLI):**
- On device at the `main` acceptance pass: paste a code from Mailpit, SMS-style autofill suggestion, eye toggle, Register bottom, Welcome gear.

## Implementation Notes

Implemented by a subagent. Matrix audit (orchestrator): `fillCodeDigits` spread a full code from the box it landed in, so a code pasted into box 4 filled only boxes 4–6, against the « any box » row. Fixed: six digits or more always fill every box, and a filled box that receives its digit plus a pasted code drops that digit first. Two tests added.

## Plan Change Log

## Review Triage Log

Quick review, pass 1: 3 findings, high 2, medium 1, all patched by the implementer, then full verification green (738 tests, type-check, lint).

- high, patched: `maxLength={6}` truncates a paste natively before `onChangeText` (Android `LengthFilter`), so « 123 456 » or a code with a leading space lost digits. The boxes now cap at `CODE_INPUT_MAX_LENGTH` (32) and `fillCodeDigits` filters.
- high, patched: the strip for « box digit + pasted code » expected 7 characters that the old cap made unreachable, and « 912345 » would have auto-submitted a wrong code. Reachable since the cap was raised, and tested.
- medium, patched: the 2-digit strip rule turned « 12 » pasted over a selected 1 into a lone 2. Typing over a selected digit already arrives as one character, so the 2-digit case was removed. The 7-digit strip stays: a 7-digit paste over a box holding its first digit is the only input it misreads, which a 6-digit code never produces.
