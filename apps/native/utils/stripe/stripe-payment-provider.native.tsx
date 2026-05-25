import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import { env } from "@zen-doc/env/native";
import {
  createContext,
  type PropsWithChildren,
  useContext,
} from "react";

interface PaymentSheetResult {
  error?: { code?: string; message?: string };
}

interface PaymentSheetContextValue {
  initPaymentSheet: (params: {
    paymentIntentClientSecret: string;
    merchantDisplayName?: string;
  }) => Promise<PaymentSheetResult>;
  presentPaymentSheet: () => Promise<PaymentSheetResult>;
}

const PaymentSheetContext = createContext<PaymentSheetContextValue | null>(
  null
);

function PaymentSheetProviderInner({ children }: PropsWithChildren) {
  const stripe = useStripe();

  return (
    <PaymentSheetContext.Provider
      value={{
        initPaymentSheet: async (params) =>
          stripe.initPaymentSheet({
            ...params,
            merchantDisplayName: params.merchantDisplayName ?? "Zen Doc",
          }),
        presentPaymentSheet: async () => stripe.presentPaymentSheet(),
      }}
    >
      {children}
    </PaymentSheetContext.Provider>
  );
}

export function StripePaymentProvider({ children }: PropsWithChildren) {
  return (
    <StripeProvider publishableKey={env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}>
      <PaymentSheetProviderInner>{children}</PaymentSheetProviderInner>
    </StripeProvider>
  );
}

export function usePaymentSheet(): PaymentSheetContextValue {
  const ctx = useContext(PaymentSheetContext);
  if (!ctx) {
    throw new Error(
      "usePaymentSheet must be used within StripePaymentProvider"
    );
  }
  return ctx;
}
