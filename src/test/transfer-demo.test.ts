import { describe, expect, it } from "vitest";

import { calculateDemoTransferQuote } from "@/lib/transfer-demo";

describe("illustrative ThonPay transfer quote", () => {
  it("matches the provided KSh 5,000 example and fee", () => {
    expect(calculateDemoTransferQuote(5000)).toMatchObject({
      amountKes: 5000,
      feeKes: 50,
      totalKes: 5050,
    });
  });
});