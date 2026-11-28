import { describe, expect, it } from "vitest";

import { buildPhoneOtpRequest, normalizePhoneNumber } from "@/lib/phone-auth";

describe("ThonPay phone authentication", () => {
  it("normalizes an international phone number", () => {
    expect(normalizePhoneNumber(" +254 712 345 678 ")).toBe("+254712345678");
  });

  it("rejects an email address as a sign-in identifier", () => {
    expect(normalizePhoneNumber("person@example.com")).toBeNull();
  });

  it("sends signup profile fields with the SMS request and no email or password", () => {
    const request = buildPhoneOtpRequest("sign-up", "+254712345678", " Amina Otieno ");

    expect(request).toEqual({
      phone: "+254712345678",
      options: {
        shouldCreateUser: true,
        data: { full_name: "Amina Otieno", phone_number: "+254712345678" },
      },
    });
    expect(request).not.toHaveProperty("email");
    expect(request).not.toHaveProperty("password");
  });

  it("only sends sign-in codes for existing accounts", () => {
    expect(buildPhoneOtpRequest("sign-in", "+211912345678", "")).toEqual({
      phone: "+211912345678",
      options: { shouldCreateUser: false },
    });
  });
});