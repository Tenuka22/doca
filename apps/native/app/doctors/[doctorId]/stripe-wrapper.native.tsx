import { StripeProvider } from "@stripe/stripe-react-native";
import { env } from "@zen-doc/env/native";
import type { ComponentType, PropsWithChildren } from "react";

export const PaymentWrapper: ComponentType<
  PropsWithChildren<Record<never, never>>
> = ({ children }) => (
  <StripeProvider publishableKey={env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}>
    {children}
  </StripeProvider>
);
