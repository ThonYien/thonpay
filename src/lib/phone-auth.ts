export type PhoneAuthMode = "sign-in" | "sign-up";

export function normalizePhoneNumber(value: string): string | null {
  const normalized = value.trim().replace(/[\s().-]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : null;
}

export function buildPhoneOtpRequest(mode: PhoneAuthMode, phone: string, fullName: string) {
  return {
    phone,
    options: {
      shouldCreateUser: mode === "sign-up",
      ...(mode === "sign-up"
        ? { data: { full_name: fullName.trim(), phone_number: phone } }
        : {}),
    },
  };
}