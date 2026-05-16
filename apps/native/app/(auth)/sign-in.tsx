import { useSignIn } from "@clerk/expo";
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
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const placeholderTextColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280";

  const emailCodeFactor = signIn.supportedSecondFactors.find(
    (factor) => factor.strategy === "email_code"
  );
  const requiresEmailCode =
    signIn.status === "needs_client_trust" ||
    (signIn.status === "needs_second_factor" && !!emailCodeFactor);

  const handleSubmit = async () => {
    setStatusMessage(null);

    const { error } = await signIn.password({
      emailAddress,
      password,
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      setStatusMessage(
        error.longMessage ?? "Unable to sign in. Please try again."
      );
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return;
          }

          pushDecoratedUrl(router, decorateUrl, "/");
        },
      });
    } else if (
      signIn.status === "needs_second_factor" ||
      signIn.status === "needs_client_trust"
    ) {
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
        setStatusMessage(
          `We sent a verification code to ${emailCodeFactor.safeIdentifier}.`
        );
      } else {
        console.error(
          "Second factor is required, but email_code is not available:",
          signIn
        );
        setStatusMessage(
          "A second factor is required, but this screen only supports email codes right now."
        );
      }
    } else {
      console.error("Sign-in attempt not complete:", signIn);
      setStatusMessage(
        "Sign-in could not be completed. Check the logs for more details."
      );
    }
  };

  const handleVerify = async () => {
    setStatusMessage(null);

    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return;
          }

          pushDecoratedUrl(router, decorateUrl, "/");
        },
      });
    } else {
      console.error("Sign-in attempt not complete:", signIn);
      setStatusMessage("That code did not complete sign-in. Please try again.");
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ flexGrow: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 justify-center px-page py-page">
        {requiresEmailCode ? (
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
              onPress={() => signIn.mfa.sendEmailCode()}
            >
              <Text className="font-medium font-sans text-foreground">
                I need a new code
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-section rounded-card border-2 border-border bg-card p-card">
            <Text className="font-medium font-sans text-4xl text-foreground">
              Sign in
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
              {errors.fields.identifier ? (
                <Text className="font-medium font-sans text-destructive text-sm">
                  {errors.fields.identifier.message}
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
                Sign in
              </Text>
            </Pressable>

            <View className="flex-row items-center gap-chip">
              <Text className="font-normal font-sans text-foreground">
                Don&apos;t have an account?
              </Text>
              <Link href="/sign-up">
                <Text className="font-medium font-sans text-primary">
                  Sign up
                </Text>
              </Link>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
