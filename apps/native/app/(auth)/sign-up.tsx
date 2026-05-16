import { useAuth, useSignUp } from "@clerk/expo";
import { type Href, Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

function pushDecoratedUrl(
  router: ReturnType<typeof useRouter>,
  decorateUrl: (url: string) => string,
  href: string
) {
  const url = decorateUrl(href);
  const nextHref = url.startsWith("http") ? new URL(url).pathname : url;
  router.push(nextHref as Href);
}

export default function Page() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const placeholderTextColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280";

  const handleSubmit = async () => {
    setStatusMessage(null);

    const { error } = await signUp.password({
      emailAddress,
      password,
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      setStatusMessage(
        error.longMessage ?? "Unable to sign up. Please try again."
      );
      return;
    }

    await signUp.verifications.sendEmailCode();
    setStatusMessage(`We sent a verification code to ${emailAddress}.`);
  };

  const handleVerify = async () => {
    setStatusMessage(null);

    await signUp.verifications.verifyEmailCode({ code });

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return;
          }

          pushDecoratedUrl(router, decorateUrl, "/");
        },
      });
    } else {
      console.error("Sign-up attempt not complete:", signUp);
      setStatusMessage("That code did not complete sign-up. Please try again.");
    }
  };

  if (signUp.status === "complete" || isSignedIn) {
    return null;
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ flexGrow: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 justify-center px-page py-page">
        {signUp.status === "missing_requirements" &&
        signUp.unverifiedFields.includes("email_address") &&
        signUp.missingFields.length === 0 ? (
          <View className="gap-section rounded-card border-2 border-border bg-card p-card">
            <Text className="font-medium font-sans text-4xl text-foreground">
              Verify your account
            </Text>
            {statusMessage ? (
              <Text className="font-normal font-sans text-muted-foreground text-sm">
                {statusMessage}
              </Text>
            ) : null}

            <View className="gap-chip">
              <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
                Verification code
              </Text>
              <TextInput
                autoComplete="one-time-code"
                className="rounded-control border-2 border-border bg-background px-card py-control font-sans text-foreground"
                keyboardType="numeric"
                onChangeText={setCode}
                placeholder="Enter your verification code"
                placeholderTextColor={placeholderTextColor}
                value={code}
              />
              {errors.fields.code ? (
                <Text className="font-medium font-sans text-destructive text-sm">
                  {errors.fields.code.message}
                </Text>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              className="items-center rounded-control border-2 border-border bg-primary px-card py-control active:opacity-80 disabled:opacity-50"
              disabled={fetchStatus === "fetching"}
              onPress={handleVerify}
            >
              <Text className="font-medium font-sans text-primary-foreground">
                Verify
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              className="items-center rounded-control border-2 border-border bg-card px-card py-control active:opacity-80"
              onPress={() => signUp.verifications.sendEmailCode()}
            >
              <Text className="font-medium font-sans text-foreground">
                I need a new code
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-section rounded-card border-2 border-border bg-card p-card">
            <Text className="font-medium font-sans text-4xl text-foreground">
              Sign up
            </Text>
            {statusMessage ? (
              <Text className="font-normal font-sans text-muted-foreground text-sm">
                {statusMessage}
              </Text>
            ) : null}

            <View className="gap-chip">
              <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
                Email address
              </Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                className="rounded-control border-2 border-border bg-background px-card py-control font-sans text-foreground"
                keyboardType="email-address"
                onChangeText={setEmailAddress}
                placeholder="Enter email"
                placeholderTextColor={placeholderTextColor}
                value={emailAddress}
              />
              {errors.fields.emailAddress ? (
                <Text className="font-medium font-sans text-destructive text-sm">
                  {errors.fields.emailAddress.message}
                </Text>
              ) : null}
            </View>

            <View className="gap-chip">
              <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
                Password
              </Text>
              <TextInput
                className="rounded-control border-2 border-border bg-background px-card py-control font-sans text-foreground"
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={placeholderTextColor}
                secureTextEntry
                value={password}
              />
              {errors.fields.password ? (
                <Text className="font-medium font-sans text-destructive text-sm">
                  {errors.fields.password.message}
                </Text>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              className="items-center rounded-control border-2 border-border bg-primary px-card py-control active:opacity-80 disabled:opacity-50"
              disabled={
                !(emailAddress && password) || fetchStatus === "fetching"
              }
              onPress={handleSubmit}
            >
              <Text className="font-medium font-sans text-primary-foreground">
                Sign up
              </Text>
            </Pressable>

            <View className="flex-row items-center gap-chip">
              <Text className="font-normal font-sans text-foreground">
                Already have an account?
              </Text>
              <Link href="/sign-in">
                <Text className="font-medium font-sans text-primary">
                  Sign in
                </Text>
              </Link>
            </View>

            <View nativeID="clerk-captcha" />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
