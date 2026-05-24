interface PaymentSheetError {
  code: string;
  message: string;
}

interface InitPaymentSheetResult {
  error: PaymentSheetError | null;
}

interface PresentPaymentSheetResult {
  error: PaymentSheetError | null;
}

export async function initPaymentSheet(): Promise<InitPaymentSheetResult> {
  return { error: null };
}

export async function presentPaymentSheet(): Promise<PresentPaymentSheetResult> {
  return { error: null };
}
