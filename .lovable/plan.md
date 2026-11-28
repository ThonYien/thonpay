# Phone-only sign-in for ThonPay

## User experience
- Add a signed-out screen with separate create-account and sign-in modes.
- Signup collects a full name and international phone number, sends a one-time SMS code, and completes account creation after verification.
- Sign-in sends a code only for existing accounts; both modes verify the code before opening the transfer demo.
- Show the signed-in name and a sign-out control. Never request an email or password; keep transfers simulated and session-only.

## Implementation
- Use Lovable Cloud phone OTP through the existing browser auth client.
- Keep profile creation on the existing auth trigger and read profile details through the owner-only profile policy; no schema change is needed.
- Add focused phone validation and auth-flow tests, and style the account screen with the existing ThonPay tokens.
- Surface SMS-provider/configuration errors without substituting email sign-in. The current backend status check does not reveal whether SMS delivery is enabled.

## Verification
- Run relevant tests, check the current preview build diagnostics, and exercise the signed-out screen and OTP form in the preview.
- Mark real SMS delivery as unverified unless the available environment can confirm it without contacting an unprovided phone number.
