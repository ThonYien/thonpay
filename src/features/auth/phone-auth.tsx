import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  LoaderCircle,
  MessageSquareText,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { buildPhoneOtpRequest, normalizePhoneNumber, type PhoneAuthMode } from "@/lib/phone-auth";
import { ThonPayApp } from "@/features/transfers/thonpay-app";

type AuthPhase = "phone" | "code";

function friendlyAuthError(message: string, phase: AuthPhase) {
  const lowerMessage = message.toLowerCase();
  if (/sms|phone|provider|not configured|unsupported/.test(lowerMessage)) {
    return "SMS verification is not available right now. Confirm SMS is enabled for this app, then try again.";
  }
  if (/rate limit|too many/.test(lowerMessage)) {
    return "Too many code requests. Wait a little before trying again.";
  }
  if (phase === "code") {
    return "That code could not be verified. Check it and try again, or request a new one.";
  }
  return "We could not send a code. Check the phone number and try again.";
}

export function PhoneAuthGate() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authCheckError, setAuthCheckError] = useState("");
  const [mode, setMode] = useState<PhoneAuthMode>("sign-in");
  const [phase, setPhase] = useState<AuthPhase>("phone");
  const [fullName, setFullName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setAccountName("");
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setUser(session?.user ?? null);
      }
    });

    void supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setAuthCheckError("We could not confirm your sign-in. Check your connection and try again.");
          setUser(null);
        } else {
          setUser(data.user ?? null);
        }
        setAuthLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setAuthCheckError("We could not confirm your sign-in. Check your connection and try again.");
        setUser(null);
        setAuthLoading(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setAccountName("");
      return;
    }

    let active = true;
    const metadataName = user.user_metadata["full_name"];
    const fallbackName = typeof metadataName === "string" ? metadataName : user.phone ?? "ThonPay account";
    setAccountName(fallbackName);

    void supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active || error) return;
        const savedName = data?.full_name.trim();
        if (savedName) setAccountName(savedName);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [user]);

  async function requestCode(phone: string, moveToCode: boolean) {
    setIsSubmitting(true);
    setErrorMessage("");
    setAuthCheckError("");
    setNotice("");

    try {
      const { error } = await supabase.auth.signInWithOtp(
        buildPhoneOtpRequest(mode, phone, fullName),
      );
      if (error) {
        setErrorMessage(friendlyAuthError(error.message, "phone"));
        return;
      }

      setVerifiedPhone(phone);
      if (moveToCode) {
        setCode("");
        setPhase("code");
      }
      setNotice(`Enter the code sent to ${phone}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "SMS provider unavailable";
      setErrorMessage(friendlyAuthError(message, "phone"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const phone = normalizePhoneNumber(phoneInput);
    if (!phone) {
      setErrorMessage("Enter a valid phone number in international format, including its + country code.");
      setNotice("");
      return;
    }
    if (mode === "sign-up" && !fullName.trim()) {
      setErrorMessage("Enter your full name to create an account.");
      return;
    }

    setPhoneInput(phone);
    void requestCode(phone, true);
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setErrorMessage("Enter the 6-digit code from your SMS.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setNotice("");
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: verifiedPhone,
        token: code,
        type: "sms",
      });
      if (error) {
        setErrorMessage(friendlyAuthError(error.message, "code"));
        return;
      }
      if (!data.user || !data.session) {
        setErrorMessage("Your number was not signed in. Request a new code and try again.");
        return;
      }
      setUser(data.user);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Code verification failed";
      setErrorMessage(friendlyAuthError(message, "code"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  function changeMode(nextMode: PhoneAuthMode) {
    setMode(nextMode);
    setPhase("phone");
    setCode("");
    setErrorMessage("");
    setNotice("");
  }

  if (authLoading) {
    return (
      <main className="th-auth-loading" role="status" aria-live="polite">
        <LoaderCircle aria-hidden="true" className="th-auth-spinner" />
        <span>Checking your account…</span>
      </main>
    );
  }

  if (user) {
    return (
      <ThonPayApp
        accountName={accountName || user.phone || "ThonPay account"}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div className="th-auth-screen">
      <aside className="th-auth-story">
        <div className="th-auth-brand">
          <div className="th-mark" aria-hidden="true">
            <ArrowLeftRight />
          </div>
          <div>
            <strong>ThonPay</strong>
            <span>KENYA TO SOUTH SUDAN</span>
          </div>
        </div>
        <div className="th-auth-story-copy">
          <p className="th-auth-eyebrow">PERSONAL ACCOUNT</p>
          <h1>Continue to ThonPay.</h1>
          <p>Use your mobile number to access the South Sudan transfer demo.</p>
          <div className="th-auth-route-line">
            <span>KENYA</span>
            <ArrowRight aria-hidden="true" />
            <strong>SOUTH SUDAN</strong>
          </div>
        </div>
        <div className="th-auth-safety-note">
          <ShieldCheck aria-hidden="true" />
          <span>SMS sign-in. Demo transfers only; no money moves.</span>
        </div>
      </aside>

      <main className="th-auth-main">
        <section className="th-auth-form-wrap" aria-labelledby="th-auth-title">
          {phase === "code" && (
            <Button
              type="button"
              variant="ghost"
              className="th-auth-back-button"
              onClick={() => {
                setPhase("phone");
                setErrorMessage("");
                setNotice("");
              }}
            >
              <ArrowLeft aria-hidden="true" /> Change number
            </Button>
          )}

          <div className="th-auth-icon" aria-hidden="true">
            {phase === "code" ? <MessageSquareText /> : <Smartphone />}
          </div>
          <p className="th-auth-eyebrow">PHONE VERIFICATION</p>
          <h2 id="th-auth-title">
            {phase === "code"
              ? "Enter your 6-digit code"
              : mode === "sign-up"
                ? "Create your account"
                : "Welcome back"}
          </h2>
          <p className="th-auth-intro">
            {phase === "code"
              ? `We sent a code to ${verifiedPhone}.`
              : mode === "sign-up"
                ? "Start with your name and mobile number."
                : "Sign in with the phone number linked to your account."}
          </p>

          {phase === "phone" ? (
            <form className="th-auth-form" onSubmit={handleSendCode}>
              {mode === "sign-up" && (
                <>
                  <label className="th-auth-label" htmlFor="th-auth-name">Full name</label>
                  <Input
                    id="th-auth-name"
                    className="th-input th-auth-input"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </>
              )}
              <label className="th-auth-label" htmlFor="th-auth-phone">Mobile number</label>
              <Input
                id="th-auth-phone"
                className="th-input th-auth-input"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                placeholder="+254 7xx xxx xxx or +211 …"
                aria-describedby="th-auth-phone-help"
                required
              />
              <p id="th-auth-phone-help" className="th-auth-field-help">
                Include the + sign and your country code.
              </p>
              <Button type="submit" className="th-auth-submit" disabled={isSubmitting}>
                {isSubmitting ? <LoaderCircle className="th-auth-spinner" aria-hidden="true" /> : <MessageSquareText aria-hidden="true" />}
                Send SMS code
              </Button>
            </form>
          ) : (
            <form className="th-auth-form" onSubmit={handleVerifyCode}>
              <label className="th-auth-label" htmlFor="th-auth-code">Verification code</label>
              <Input
                id="th-auth-code"
                className="th-input th-auth-input th-auth-code-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                required
              />
              <Button type="submit" className="th-auth-submit" disabled={isSubmitting}>
                {isSubmitting ? <LoaderCircle className="th-auth-spinner" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
                Verify and continue
              </Button>
              <Button
                type="button"
                variant="link"
                className="th-auth-resend"
                disabled={isSubmitting}
                onClick={() => void requestCode(verifiedPhone, false)}
              >
                Send a new code
              </Button>
            </form>
          )}

          {(errorMessage || authCheckError) && (
            <p className="th-auth-error" role="alert">
              {errorMessage || authCheckError}
            </p>
          )}
          {notice && <p className="th-auth-notice" role="status">{notice}</p>}

          {phase === "phone" && (
            <div className="th-auth-mode-switch">
              <span>{mode === "sign-up" ? "Already have an account?" : "New to ThonPay?"}</span>
              <Button
                type="button"
                variant="link"
                className="th-auth-text-button"
                onClick={() => changeMode(mode === "sign-up" ? "sign-in" : "sign-up")}
              >
                {mode === "sign-up" ? "Sign in" : "Create an account"}
              </Button>
            </div>
          )}
          <p className="th-auth-privacy-note">No email address or password is required.</p>
        </section>
      </main>
    </div>
  );
}