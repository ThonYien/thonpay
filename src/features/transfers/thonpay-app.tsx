import { useState, type FormEvent } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  Banknote,
  Building2,
  CircleHelp,
  Clock3,
  FileClock,
  House,
  Landmark,
  MapPin,
  ShieldCheck,
  Smartphone,
  Send,
  TriangleAlert,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  calculateDemoTransferQuote,
  DEMO_KES_TO_SSP_RATE,
  type DemoTransferQuote,
} from "@/lib/transfer-demo";

type AppView = "overview" | "send" | "activity" | "support" | "confirmation";
type PayoutMethod = "MTN Mobile Money" | "m-Gurush" | "Bank account" | "Cash pickup";
type PaymentMethod = "M-PESA" | "Bank transfer";

type TransferRecord = DemoTransferQuote & {
  reference: string;
  recipientName: string;
  recipientPhone: string;
  payoutMethod: PayoutMethod;
  paymentMethod: PaymentMethod;
  createdAt: string;
};

const navigation: { id: Exclude<AppView, "confirmation">; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: House },
  { id: "send", label: "Send money", icon: Send },
  { id: "activity", label: "Activity", icon: FileClock },
  { id: "support", label: "Help & support", icon: CircleHelp },
];

const payoutMethods: { label: PayoutMethod; icon: LucideIcon; detail: string }[] = [
  { label: "MTN Mobile Money", icon: Smartphone, detail: "Mobile wallet" },
  { label: "m-Gurush", icon: Wallet, detail: "Mobile wallet" },
  { label: "Bank account", icon: Landmark, detail: "Bank deposit" },
  { label: "Cash pickup", icon: MapPin, detail: "Authorized agent" },
];

function formatKes(amount: number) {
  return `KSh ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(amount)}`;
}

function formatSsp(amount: number) {
  return `SSP ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(amount)}`;
}

function pageTitle(view: AppView, step: "details" | "review") {
  if (view === "overview") return "Send money to South Sudan";
  if (view === "send") return step === "review" ? "Review transfer" : "Send money";
  if (view === "activity") return "Transfer activity";
  if (view === "support") return "Help & support";
  return "Simulation confirmed";
}

function pageDescription(view: AppView, step: "details" | "review") {
  if (view === "overview") return "A simple route from Kenya to the people and businesses you care about.";
  if (view === "send" && step === "review") return "Check the example details before creating your simulation.";
  if (view === "send") return "Choose a recipient, payment method and how they’ll receive the funds.";
  if (view === "activity") return "Transfers created in this browser session appear here.";
  if (view === "support") return "Clear answers about this ThonPay prototype.";
  return "Your example transfer is recorded in this browser session only.";
}

function NavigationButton({
  active,
  icon: Icon,
  label,
  onClick,
  mobile = false,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  mobile?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      className={mobile ? "th-mobile-nav-button" : "th-nav-button"}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </Button>
  );
}

function PrototypeNotice() {
  return (
    <div className="th-prototype-notice" role="note">
      <TriangleAlert aria-hidden="true" />
      <p>
        <strong>Prototype only.</strong> Rates and fees are examples; no money moves and no one is
        contacted.
      </p>
    </div>
  );
}

function QuotePanel({ quote }: { quote: DemoTransferQuote }) {
  return (
    <aside className="th-quote-panel" aria-label="Illustrative transfer estimate">
      <div className="th-quote-heading">
        <div>
          <p className="th-eyebrow">EXAMPLE ESTIMATE</p>
          <h2>Transfer summary</h2>
        </div>
        <div className="th-mark th-mark-small" aria-hidden="true">
          <ArrowLeftRight />
        </div>
      </div>
      <div className="th-quote-line">
        <span>You send</span>
        <strong>{formatKes(quote.amountKes)}</strong>
      </div>
      <div className="th-quote-line">
        <span>Example fee</span>
        <strong>{formatKes(quote.feeKes)}</strong>
      </div>
      <div className="th-quote-line th-quote-total">
        <span>Total payment</span>
        <strong>{formatKes(quote.totalKes)}</strong>
      </div>
      <div className="th-recipient-amount">
        <p>Recipient gets</p>
        <strong>{formatSsp(quote.receiveAmountSsp)}</strong>
        <span>Sample rate: 1 KES = {DEMO_KES_TO_SSP_RATE.toFixed(2)} SSP</span>
      </div>
      <p className="th-quote-footnote">For demonstration only. Not a live exchange rate or offer.</p>
    </aside>
  );
}

function TransferRow({ transfer }: { transfer: TransferRecord }) {
  return (
    <div className="th-transfer-row">
      <div className="th-transfer-recipient">
        <div className="th-recipient-avatar" aria-hidden="true">
          {transfer.recipientName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <strong>{transfer.recipientName}</strong>
          <span>{transfer.reference}</span>
        </div>
      </div>
      <div className="th-transfer-detail">
        <span>{transfer.payoutMethod}</span>
        <Badge variant="secondary" className="th-simulation-badge">
          Simulated
        </Badge>
      </div>
      <div className="th-transfer-values">
        <strong>{formatKes(transfer.totalKes)}</strong>
        <span>Recipient: {formatSsp(transfer.receiveAmountSsp)}</span>
      </div>
    </div>
  );
}

function TransferList({
  transfers,
  onSend,
  compact = false,
}: {
  transfers: TransferRecord[];
  onSend: () => void;
  compact?: boolean;
}) {
  const visibleTransfers = compact ? transfers.slice(0, 3) : transfers;

  if (visibleTransfers.length === 0) {
    return (
      <div className="th-empty-state">
        <div className="th-empty-icon" aria-hidden="true">
          <Clock3 />
        </div>
        <h3>No transfers yet</h3>
        <p>Example transfers you create will appear here during this session.</p>
        <Button type="button" variant="outline" onClick={onSend}>
          <Send aria-hidden="true" /> Start a simulation
        </Button>
      </div>
    );
  }

  return (
    <div className="th-transfer-list">
      {visibleTransfers.map((transfer) => (
        <TransferRow key={transfer.reference} transfer={transfer} />
      ))}
    </div>
  );
}

export function ThonPayApp() {
  const [view, setView] = useState<AppView>("overview");
  const [step, setStep] = useState<"details" | "review">("details");
  const [sendAmount, setSendAmount] = useState("5000");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("MTN Mobile Money");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("M-PESA");
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [referenceCount, setReferenceCount] = useState(1);
  const [receipt, setReceipt] = useState<TransferRecord | null>(null);

  const quote = calculateDemoTransferQuote(Number(sendAmount));
  const amountIsValid = Number.isFinite(Number(sendAmount)) && Number(sendAmount) > 0;
  const recipientIsValid = recipientName.trim().length > 0 && recipientPhone.trim().length > 0;

  function openSend() {
    setStep("details");
    setView("send");
  }

  function reviewTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!amountIsValid || !recipientIsValid) return;
    setStep("review");
  }

  function confirmSimulation() {
    const nextReference = `THP-DEMO-${String(referenceCount).padStart(5, "0")}`;
    const nextTransfer: TransferRecord = {
      ...quote,
      reference: nextReference,
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      payoutMethod,
      paymentMethod,
      createdAt: new Date().toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }),
    };

    setReferenceCount((current) => current + 1);
    setTransfers((current) => [nextTransfer, ...current]);
    setReceipt(nextTransfer);
    setView("confirmation");
  }

  function startAnotherSimulation() {
    setRecipientName("");
    setRecipientPhone("");
    setSendAmount("5000");
    setStep("details");
    setView("send");
  }

  const title = pageTitle(view, step);
  const description = pageDescription(view, step);
  const selectedNavView = view === "confirmation" ? "send" : view;

  return (
    <div className="th-app-shell">
      <aside className="th-sidebar">
        <div className="th-brand-lockup">
          <div className="th-mark" aria-hidden="true">
            <ArrowLeftRight />
          </div>
          <div className="th-brand-copy">
            <span className="th-brand-name">ThonPay</span>
            <span className="th-brand-subtitle">KENYA TO SOUTH SUDAN</span>
          </div>
        </div>

        <div className="th-sidebar-route">
          <span className="th-route-dot" aria-hidden="true" />
          <span>Kenya</span>
          <ArrowRight aria-hidden="true" />
          <strong>South Sudan</strong>
        </div>

        <nav className="th-desktop-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavigationButton
              key={item.id}
              active={selectedNavView === item.id}
              icon={item.icon}
              label={item.label}
              onClick={() => setView(item.id)}
            />
          ))}
        </nav>

        <div className="th-sidebar-footer">
          <div className="th-security-note">
            <ShieldCheck aria-hidden="true" />
            <div>
              <strong>Built for clarity</strong>
              <span>Example figures are always labelled.</span>
            </div>
          </div>
          <span className="th-build-label">TRANSFER PROTOTYPE · 2026</span>
        </div>
      </aside>

      <div className="th-main-column">
        <header className="th-mobile-header">
          <div className="th-brand-lockup">
            <div className="th-mark" aria-hidden="true">
              <ArrowLeftRight />
            </div>
            <span className="th-brand-name">ThonPay</span>
          </div>
          <Badge variant="outline" className="th-mobile-demo-badge">
            Demo
          </Badge>
        </header>

        <main className="th-main-content">
          <PrototypeNotice />

          <header className="th-page-heading">
            <div>
              <p className="th-eyebrow">KENYA <span>→</span> SOUTH SUDAN</p>
              <h1>{title}</h1>
              <p className="th-page-description">{description}</p>
            </div>
            {view !== "send" && view !== "confirmation" && (
              <Button type="button" className="th-heading-action" onClick={openSend}>
                <Send aria-hidden="true" /> Send money
              </Button>
            )}
          </header>

          {view === "overview" && (
            <div className="th-page-body">
              <section className="th-overview-top">
                <div className="th-overview-intro">
                  <span className="th-intro-kicker">
                    <MapPin aria-hidden="true" /> YOUR KENYA → SOUTH SUDAN ROUTE
                  </span>
                  <h2>Send money. Pay less. Receive easily.</h2>
                  <p>
                    Explore a straightforward transfer from Kenya, with mobile money, bank and agent
                    collection options for the recipient.
                  </p>
                  <Button type="button" size="lg" onClick={openSend}>
                    <Send aria-hidden="true" /> Start a transfer
                  </Button>
                  <div className="th-overview-proof">
                    <span><Smartphone aria-hidden="true" /> Mobile money first</span>
                    <span><ShieldCheck aria-hidden="true" /> Clear example totals</span>
                  </div>
                </div>
                <QuotePanel quote={calculateDemoTransferQuote(5000)} />
              </section>

              <section className="th-section-block th-home-activity">
                <div className="th-section-header">
                  <div>
                    <p className="th-eyebrow">THIS SESSION</p>
                    <h2>Your recent simulations</h2>
                  </div>
                  {transfers.length > 0 && (
                    <Button type="button" variant="ghost" onClick={() => setView("activity")}>
                      View activity <ArrowRight aria-hidden="true" />
                    </Button>
                  )}
                </div>
                <TransferList transfers={transfers} onSend={openSend} compact />
              </section>
            </div>
          )}

          {view === "send" && (
            <div className="th-page-body">
              <div className="th-transfer-steps" aria-label="Transfer steps">
                <span className={step === "details" ? "th-step th-step-active" : "th-step th-step-done"}>
                  <span>1</span> Recipient & amount
                </span>
                <span className="th-step-line" aria-hidden="true" />
                <span className={step === "review" ? "th-step th-step-active" : "th-step"}>
                  <span>2</span> Review
                </span>
              </div>

              <div className="th-send-layout">
                <section className="th-transfer-form-section" aria-label="Transfer details">
                  {step === "details" ? (
                    <form className="th-transfer-form" onSubmit={reviewTransfer}>
                      <div className="th-form-section-heading">
                        <div className="th-form-step-icon"><span>01</span></div>
                        <div>
                          <h2>Who are you sending to?</h2>
                          <p>They’ll receive the funds in South Sudan.</p>
                        </div>
                      </div>

                      <label className="th-field-label" htmlFor="recipient-name">Recipient full name</label>
                      <Input
                        id="recipient-name"
                        className="th-input"
                        autoComplete="name"
                        placeholder="Name as it appears on their account"
                        value={recipientName}
                        onChange={(event) => setRecipientName(event.target.value)}
                        required
                      />

                      <label className="th-field-label" htmlFor="recipient-phone">Recipient phone number</label>
                      <Input
                        id="recipient-phone"
                        className="th-input"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+211 …"
                        value={recipientPhone}
                        onChange={(event) => setRecipientPhone(event.target.value)}
                        required
                      />

                      <fieldset className="th-method-fieldset">
                        <legend>How should they receive it?</legend>
                        <div className="th-payout-grid">
                          {payoutMethods.map(({ label, detail, icon: Icon }) => (
                            <Button
                              key={label}
                              type="button"
                              variant={payoutMethod === label ? "secondary" : "outline"}
                              className="th-option-button"
                              aria-pressed={payoutMethod === label}
                              onClick={() => setPayoutMethod(label)}
                            >
                              <Icon aria-hidden="true" />
                              <span><strong>{label}</strong><small>{detail}</small></span>
                            </Button>
                          ))}
                        </div>
                      </fieldset>

                      <div className="th-divider" />

                      <div className="th-form-section-heading th-amount-heading">
                        <div className="th-form-step-icon"><span>02</span></div>
                        <div>
                          <h2>How much would you like to send?</h2>
                          <p>Enter an amount in Kenyan shillings.</p>
                        </div>
                      </div>

                      <label className="th-field-label" htmlFor="send-amount">Amount to send</label>
                      <div className="th-amount-input-wrap">
                        <span>KES</span>
                        <Input
                          id="send-amount"
                          className="th-input th-amount-input"
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={sendAmount}
                          onChange={(event) => setSendAmount(event.target.value)}
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        variant="link"
                        className="th-example-amount"
                        onClick={() => setSendAmount("5000")}
                      >
                        Use the KSh 5,000 example
                      </Button>

                      <fieldset className="th-method-fieldset th-payment-fieldset">
                        <legend>How will you pay in Kenya?</legend>
                        <div className="th-payment-options">
                          <Button
                            type="button"
                            variant={paymentMethod === "M-PESA" ? "secondary" : "outline"}
                            className="th-payment-button"
                            aria-pressed={paymentMethod === "M-PESA"}
                            onClick={() => setPaymentMethod("M-PESA")}
                          >
                            <Smartphone aria-hidden="true" /> M-PESA
                          </Button>
                          <Button
                            type="button"
                            variant={paymentMethod === "Bank transfer" ? "secondary" : "outline"}
                            className="th-payment-button"
                            aria-pressed={paymentMethod === "Bank transfer"}
                            onClick={() => setPaymentMethod("Bank transfer")}
                          >
                            <Building2 aria-hidden="true" /> Bank transfer
                          </Button>
                        </div>
                      </fieldset>

                      <p className="th-method-notice">
                        <TriangleAlert aria-hidden="true" /> Payment and payout partners are not
                        connected in this demonstration.
                      </p>
                      <Button type="submit" className="th-continue-button" disabled={!amountIsValid || !recipientIsValid}>
                        Review transfer <ArrowRight aria-hidden="true" />
                      </Button>
                    </form>
                  ) : (
                    <div className="th-review-panel">
                      <div className="th-form-section-heading">
                        <div className="th-form-step-icon th-review-icon"><span>✓</span></div>
                        <div>
                          <h2>Confirm these example details</h2>
                          <p>This creates a local simulation only.</p>
                        </div>
                      </div>
                      <div className="th-review-row">
                        <span>Recipient</span>
                        <strong>{recipientName}</strong>
                      </div>
                      <div className="th-review-row">
                        <span>Mobile number</span>
                        <strong>{recipientPhone}</strong>
                      </div>
                      <div className="th-review-row">
                        <span>Receive through</span>
                        <strong>{payoutMethod}</strong>
                      </div>
                      <div className="th-review-row">
                        <span>Pay with</span>
                        <strong>{paymentMethod}</strong>
                      </div>
                      <div className="th-review-actions">
                        <Button type="button" variant="outline" onClick={() => setStep("details")}>
                          Back to details
                        </Button>
                        <Button type="button" onClick={confirmSimulation}>
                          Confirm simulation <ArrowRight aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  )}
                </section>
                <QuotePanel quote={quote} />
              </div>
            </div>
          )}

          {view === "activity" && (
            <section className="th-page-body th-section-block th-activity-page">
              <div className="th-section-header">
                <div>
                  <p className="th-eyebrow">LOCAL TO THIS BROWSER SESSION</p>
                  <h2>Transfer history</h2>
                </div>
                <Badge variant="outline" className="th-count-badge">{transfers.length} simulations</Badge>
              </div>
              <TransferList transfers={transfers} onSend={openSend} />
            </section>
          )}

          {view === "confirmation" && receipt && (
            <section className="th-page-body th-confirmation-wrap">
              <div className="th-confirmation-panel">
                <div className="th-confirmation-check" aria-hidden="true">✓</div>
                <p className="th-eyebrow">DEMO RECEIPT</p>
                <h2>Simulation created</h2>
                <p className="th-confirmation-note">
                  No money moved and no notification was sent. This receipt exists only in this browser session.
                </p>
                <div className="th-receipt-reference">
                  <span>Example reference</span>
                  <strong>{receipt.reference}</strong>
                </div>
                <div className="th-receipt-details">
                  <div><span>Recipient</span><strong>{receipt.recipientName}</strong></div>
                  <div><span>Recipient gets</span><strong>{formatSsp(receipt.receiveAmountSsp)}</strong></div>
                  <div><span>Total shown</span><strong>{formatKes(receipt.totalKes)}</strong></div>
                  <div><span>Created</span><strong>{receipt.createdAt}</strong></div>
                </div>
                <div className="th-confirmation-actions">
                  <Button type="button" onClick={() => setView("activity")}>
                    Track simulation <ArrowRight aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="outline" onClick={startAnotherSimulation}>
                    Send another example
                  </Button>
                </div>
              </div>
            </section>
          )}

          {view === "support" && (
            <section className="th-page-body th-support-layout">
              <div className="th-support-intro">
                <div className="th-support-icon" aria-hidden="true"><CircleHelp /></div>
                <div>
                  <p className="th-eyebrow">THonPAY PROTOTYPE</p>
                  <h2>Questions about this demo?</h2>
                  <p>Here’s what is and isn’t connected yet.</p>
                </div>
              </div>
              <div className="th-faq-list">
                <details>
                  <summary>Does this send real money?</summary>
                  <p>No. It does not charge a payment method, send a payout, or contact a recipient.</p>
                </details>
                <details>
                  <summary>Are the rate and fee current?</summary>
                  <p>No. KSh 50 and the KES-to-SSP sample rate are examples only, not live prices.</p>
                </details>
                <details>
                  <summary>Are M-PESA, MTN MoMo or m-Gurush connected?</summary>
                  <p>No payment, mobile money, bank or cash-pickup provider is connected in this prototype.</p>
                </details>
                <details>
                  <summary>Will the recipient get an SMS?</summary>
                  <p>No. The prototype does not send SMS, email or other notifications.</p>
                </details>
              </div>
              <div className="th-support-next-step">
                <div>
                  <p className="th-eyebrow">READY TO EXPLORE?</p>
                  <h3>Try an example transfer</h3>
                </div>
                <Button type="button" onClick={openSend}>
                  Start a simulation <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </section>
          )}
        </main>
      </div>

      <nav className="th-mobile-nav" aria-label="Main navigation">
        {navigation.map((item) => (
          <NavigationButton
            key={item.id}
            mobile
            active={selectedNavView === item.id}
            icon={item.icon}
            label={item.id === "overview" ? "Home" : item.id === "support" ? "Help" : item.label}
            onClick={() => setView(item.id)}
          />
        ))}
      </nav>
    </div>
  );
}