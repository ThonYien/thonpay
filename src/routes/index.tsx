import { createFileRoute } from "@tanstack/react-router";
import { PhoneAuthGate } from "@/features/auth/phone-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ThonPay — Kenya to South Sudan" },
      {
        name: "description",
        content:
          "Explore ThonPay’s Kenya-to-South Sudan transfer prototype with sample quotes, payout choices, and simulated tracking.",
      },
      { property: "og:title", content: "ThonPay — Kenya to South Sudan" },
      {
        property: "og:description",
        content:
          "Explore ThonPay’s Kenya-to-South Sudan transfer prototype with sample quotes, payout choices, and simulated tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ThonPayPage,
});

function ThonPayPage() {
  return <PhoneAuthGate />;
}
