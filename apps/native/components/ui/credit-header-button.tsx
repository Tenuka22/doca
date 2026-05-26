import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Modal, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { orpc } from "@/utils/orpc";
import { usePaymentSheet } from "@/utils/stripe";

export function CreditHeaderButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [selectedCredits] = useState(1);
  const creditQuery = useQuery(orpc.getUserCredits.queryOptions());
  const paymentSheet = usePaymentSheet();

  const purchaseMutation = useMutation(
    orpc.purchaseCredits.mutationOptions({
      onSuccess: async (result) => {
        if (!result.clientSecret) {
          throw new Error("Stripe did not return a payment sheet secret");
        }

        const initResult = await paymentSheet.initPaymentSheet({
          paymentIntentClientSecret: result.clientSecret,
          merchantDisplayName: "Zen Doc",
        });
        if (initResult.error) {
          throw new Error(
            initResult.error.message ?? "Unable to start payment"
          );
        }

        const presentResult = await paymentSheet.presentPaymentSheet();
        if (presentResult.error) {
          throw new Error(
            presentResult.error.message ?? "Unable to complete payment"
          );
        }

        await creditQuery.refetch();
        setModalVisible(false);
        setPurchaseError(null);
      },
      onError: (error) => {
        setPurchaseError(
          error instanceof Error ? error.message : "Unable to buy credits"
        );
      },
    })
  );

  const handleBuyCredits = () => {
    setPurchaseError(null);
    purchaseMutation.mutate({ credits: selectedCredits });
  };

  return (
    <>
      <Button
        onPress={() => setModalVisible(true)}
        size="sm"
        variant="secondary"
      >
        {creditQuery.isLoading ? (
          <ActivityIndicator size="small" />
        ) : (
          <Text className="font-bold text-foreground text-xs">
            {creditQuery.data?.balance ?? 0} Credits
          </Text>
        )}
      </Button>

      <Modal animationType="slide" transparent visible={modalVisible}>
        <View className="flex-1 justify-center bg-black/50 p-6">
          <Card>
            <Text className="font-bold text-xl">Buy Credits</Text>
            <Text className="my-4 text-muted-foreground text-sm">
              Add credits to your account. Stripe will handle the payment sheet
              securely.
            </Text>
            <View className="mb-4 rounded-lg border border-border bg-muted/40 p-4">
              <Text className="font-semibold text-foreground text-sm">
                {selectedCredits} credit
              </Text>
              <Text className="text-muted-foreground text-sm">
                Credit top-up
              </Text>
            </View>

            {purchaseError ? (
              <Text className="mb-4 text-destructive text-sm">
                {purchaseError}
              </Text>
            ) : null}

            <Button
              className="w-full"
              disabled={purchaseMutation.isPending}
              onPress={handleBuyCredits}
            >
              {purchaseMutation.isPending ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text className="font-semibold text-foreground text-xs">
                  Continue to payment
                </Text>
              )}
            </Button>

            <Button
              className="mt-3 w-full"
              onPress={() => setModalVisible(false)}
              variant="secondary"
            >
              Cancel
            </Button>
          </Card>
        </View>
      </Modal>
    </>
  );
}
