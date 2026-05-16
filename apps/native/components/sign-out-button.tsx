import { useClerk } from "@clerk/expo";
import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/");
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      className="items-center rounded-control border-2 border-border bg-card px-card py-control active:opacity-80"
      onPress={handleSignOut}
    >
      <Text className="font-medium font-sans text-foreground">Sign out</Text>
    </Pressable>
  );
};
