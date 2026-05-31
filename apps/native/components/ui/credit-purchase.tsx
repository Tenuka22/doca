import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CREDIT_PRICE_CENTS,
  MONTHLY_PLAN_AMOUNT_CENTS,
  MONTHLY_PLAN_CREDITS,
  MONTHLY_PLAN_TYPE,
  TAX_RATE,
} from "@zen-doc/pricing";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useUserMode } from "@/utils/user-mode";

import { Button } from "./button";
import { orpc } from "@/utils/orpc";
import { usePaymentSheet } from "@/utils/stripe";

const CREDIT_OPTIONS = [1, 5, 10, 20] as const;
const SUBSCRIPTION_CREDITS = MONTHLY_PLAN_CREDITS;

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

interface CreditPurchaseProps {
  forPatientUserId?: string;
  onComplete?: () => void;
}

export function CreditPurchase({ forPatientUserId, onComplete }: CreditPurchaseProps) {
  const { mode } = useUserMode();
  const [selectedCredits, setSelectedCredits] = useState<
    (typeof CREDIT_OPTIONS)[number]
  >(CREDIT_OPTIONS[0]);
  const [selectedOffer, setSelectedOffer] = useState<
    "credits" | "subscription"
  >("credits");
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const creditQuery = useQuery(orpc.getUserCredits.queryOptions());
  const subscriptionQuery = useQuery(orpc.getUserSubscription.queryOptions());
  const paymentSheet = usePaymentSheet();

  const purchaseMutation = useMutation(
    orpc.purchaseCredits.mutationOptions({
      onSuccess: async (result) => {
        if (!result.clientSecret) {
          throw new Error("Stripe did not return a payment client secret");
        }

        const initResult = await paymentSheet.initPaymentSheet({
          paymentIntentClientSecret: result.clientSecret,
          merchantDisplayName: "Zen Doc",
        });

        if (initResult.error) {
          throw new Error(
            initResult.error.message ?? "Unable to open payment sheet"
          );
        }

        const presentResult = await paymentSheet.presentPaymentSheet();
        if (presentResult.error) {
          throw new Error(presentResult.error.message ?? "Payment failed");
        }

        await creditQuery.refetch();
        setPurchaseError(null);
        onComplete?.();
      },
      onError: (error) => {
        setPurchaseError(
          error instanceof Error ? error.message : "Unable to buy credits"
        );
      },
    })
  );

  const subscriptionMutation = useMutation(
    orpc.createSubscription.mutationOptions({
      onSuccess: async (result) => {
        if (!result.clientSecret) {
          throw new Error("Stripe did not return a payment client secret");
        }

        const initResult = await paymentSheet.initPaymentSheet({
          paymentIntentClientSecret: result.clientSecret,
          merchantDisplayName: "Zen Doc",
        });

        if (initResult.error) {
          throw new Error(
            initResult.error.message ?? "Unable to open payment sheet"
          );
        }

        const presentResult = await paymentSheet.presentPaymentSheet();
        if (presentResult.error) {
          throw new Error(presentResult.error.message ?? "Payment failed");
        }

        await creditQuery.refetch();
        await subscriptionQuery.refetch();
        setPurchaseError(null);
        onComplete?.();
      },
      onError: (error) => {
        setPurchaseError(
          error instanceof Error
            ? error.message
            : "Unable to create subscription"
        );
      },
    })
  );

  const handleBuyCredits = () => {
    setPurchaseError(null);

    const mutationOptions = {
      credits: selectedCredits,
      returnUrl:
        typeof window === "undefined" ? undefined : window.location.href,
      patientUserId: forPatientUserId,
    };

    purchaseMutation.mutate(mutationOptions);
  };

  const handleSubscribe = () => {
    setPurchaseError(null);

    const mutationOptions = {
      planType: MONTHLY_PLAN_TYPE,
      returnUrl:
        typeof window === "undefined" ? undefined : window.location.href,
    } as const;

    subscriptionMutation.mutate(mutationOptions);
  };

  const getButtonText = () => {
    if (purchaseMutation.isPending || subscriptionMutation.isPending) {
      return "Processing...";
    }

    if (selectedOffer === "subscription") {
      return "Subscribe now";
    }

    return "Continue to payment";
  };

  const isPending =
    purchaseMutation.isPending || subscriptionMutation.isPending;

  return (
    <View className="gap-4">
      {forPatientUserId && mode === "guardian" && (
        <View className="rounded-lg bg-muted px-4 py-3">
          <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-[0.18em]">
            Buying for patient
          </Text>
          <Text className="font-normal font-sans text-muted-foreground text-xs mt-1">
            Credits will be added to the patient's account.
          </Text>
        </View>
      )}

      <View className="gap-1">
        <Text className="font-bold font-sans text-foreground text-sm">
          Buy Credits
        </Text>
        <Text className="font-normal font-sans text-muted-foreground text-xs">
          Choose a one-time credit pack or a monthly subscription.
        </Text>
      </View>

      {subscriptionQuery.data?.status === "active" ? null : (
        <View className="flex-row gap-2 rounded-card border-2 border-border bg-muted/20 p-1">
          <Pressable
            className={`flex-1 rounded-card px-3 py-2 ${
              selectedOffer === "credits" ? "bg-primary" : "bg-transparent"
            }`}
            onPress={() => setSelectedOffer("credits")}
          >
            <Text
              className={`text-center font-semibold font-sans text-sm ${
                selectedOffer === "credits"
                  ? "text-primary-foreground"
                  : "text-foreground"
              }`}
            >
              Credits
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 rounded-card px-3 py-2 ${
              selectedOffer === "subscription" ? "bg-primary" : "bg-transparent"
            }`}
            onPress={() => setSelectedOffer("subscription")}
          >
            <Text
              className={`text-center font-semibold font-sans text-sm ${
                selectedOffer === "subscription"
                  ? "text-primary-foreground"
                  : "text-foreground"
              }`}
            >
              Subscription
            </Text>
          </Pressable>
        </View>
      )}

      {selectedOffer === "credits" ? (
        <View className="flex-row flex-wrap gap-2">
          {CREDIT_OPTIONS.map((amount) => {
            const isSelected = selectedCredits === amount;
            const subtotal = amount * CREDIT_PRICE_CENTS;
            const total = subtotal + Math.round(subtotal * TAX_RATE);
            return (
              <Pressable
                className={`flex-1 rounded-card border-2 p-card ${
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-border bg-card"
                }`}
                key={amount}
                onPress={() => setSelectedCredits(amount)}
              >
                <Text
                  className={`text-center font-bold font-sans text-lg ${
                    isSelected
                      ? "text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {amount}
                </Text>
                <Text
                  className={`text-center font-sans text-sm ${
                    isSelected
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatPrice(total)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {selectedOffer === "subscription" &&
      subscriptionQuery.data?.status !== "active" ? (
        <View className="gap-1 rounded-card border-2 border-border bg-muted/30 p-card">
          <Text className="font-bold font-sans text-foreground text-sm">
            Monthly Subscription
          </Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground text-xs">
              Credits per month:
            </Text>
            <Text className="text-foreground text-xs">
              {SUBSCRIPTION_CREDITS} credits
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground text-xs">Cost:</Text>
            <Text className="text-foreground text-xs">
              {formatPrice(MONTHLY_PLAN_AMOUNT_CENTS)}
            </Text>
          </View>
        </View>
      ) : null}

      {selectedOffer === "credits" ? (
        <View className="gap-1 rounded-card border-2 border-border bg-muted/30 p-card">
          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground text-xs">
              Subtotal ({selectedCredits} × {formatPrice(CREDIT_PRICE_CENTS)})
            </Text>
            <Text className="text-foreground text-xs">
              {formatPrice(selectedCredits * CREDIT_PRICE_CENTS)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground text-xs">
              Tax ({(TAX_RATE * 100).toFixed(0)}%)
            </Text>
            <Text className="text-foreground text-xs">
              {formatPrice(
                Math.round(selectedCredits * CREDIT_PRICE_CENTS * TAX_RATE)
              )}
            </Text>
          </View>
          <View className="mt-1 flex-row items-center justify-between border-border border-t pt-1">
            <Text className="font-bold text-foreground text-sm">Total</Text>
            <Text className="font-bold text-foreground text-base">
              {formatPrice(
                selectedCredits * CREDIT_PRICE_CENTS +
                  Math.round(selectedCredits * CREDIT_PRICE_CENTS * TAX_RATE)
              )}
            </Text>
          </View>
        </View>
      ) : null}

      {purchaseError ? (
        <Text className="text-destructive text-sm">{purchaseError}</Text>
      ) : null}

      <View className="gap-2">
        <Button
          className="w-full"
          disabled={isPending}
          onPress={
            selectedOffer === "subscription" ? handleSubscribe : handleBuyCredits
          }
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            getButtonText()
          )}
        </Button>
      </View>
    </View>
  );
}
