export const DEMO_TRANSFER_FEE_KES = 50;
export const DEMO_KES_TO_SSP_RATE = 0.2;

export type DemoTransferQuote = {
  amountKes: number;
  feeKes: number;
  totalKes: number;
  receiveAmountSsp: number;
};

export function calculateDemoTransferQuote(amountKes: number): DemoTransferQuote {
  const safeAmount = Number.isFinite(amountKes) ? Math.max(0, amountKes) : 0;
  const roundedAmount = Math.round(safeAmount * 100) / 100;
  const feeKes = roundedAmount > 0 ? DEMO_TRANSFER_FEE_KES : 0;

  return {
    amountKes: roundedAmount,
    feeKes,
    totalKes: roundedAmount + feeKes,
    receiveAmountSsp: Math.round(roundedAmount * DEMO_KES_TO_SSP_RATE * 100) / 100,
  };
}