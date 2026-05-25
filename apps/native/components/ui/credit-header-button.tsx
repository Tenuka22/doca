import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Modal, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

export function CreditHeaderButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const creditQuery = useQuery(orpc.patient.getUserCredits.queryOptions());
  const colors = useThemeColor();

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
              Purchase credits to book your sessions.
            </Text>
            {/* Simple credit purchase options placeholder */}
            <Button className="w-full" onPress={() => setModalVisible(false)}>
              Close
            </Button>
          </Card>
        </View>
      </Modal>
    </>
  );
}
