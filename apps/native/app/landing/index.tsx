"use client";

import { useAuth, useOAuth, useSignIn, useSignUp } from "@clerk/expo";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";
import { pushDecoratedUrl } from "@/utils/auth";
import { orpc, queryClient } from "@/utils/orpc";
import { encryptData, generateUserSecret, storeSecret } from "@/utils/privacy";

const patientSchema = z.object({
  alias: z.string().min(1, "Alias is required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phone: z.string().optional(),
  fullName: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
});

type PatientForm = z.infer<typeof patientSchema>;

type Step = "start" | "auth" | "profile";

type AuthMode = "sign-in" | "sign-up";

type ProviderStrategy = "oauth_google" | "oauth_facebook";

function Field({
  label,
  error,
  ...props
}: { label: string; error?: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="gap-2">
      <Text className="font-medium font-sans text-foreground text-sm">
        {label}
      </Text>
      <TextInput
        className={`rounded-full border-2 bg-background-subtle px-5 py-4 font-sans text-base text-foreground outline-none placeholder:text-foreground-muted ${error ? "border-destructive" : "border-border"}`}
        {...props}
      />
      {error ? (
        <Text className="font-sans text-destructive text-sm">{error}</Text>
      ) : null}
    </View>
  );
}

function ActionButton({
  children,
  onPress,
  disabled,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      className={`flex-row items-center justify-between gap-4 rounded-full bg-primary px-8 py-5 font-sans text-primary-foreground ${disabled ? "opacity-60" : ""}`}
      disabled={disabled}
      onPress={onPress}
    >
      <Text className="font-medium font-sans text-base text-primary-foreground">
        {children}
      </Text>
      <ArrowRight />
    </Pressable>
  );
}

function OAuthButton({
  label,
  strategy,
}: {
  label: string;
  strategy: ProviderStrategy;
}) {
  const { startOAuthFlow } = useOAuth({ strategy });
  return (
    <ActionButton
      onPress={async () => {
        const { createdSessionId, setActive } = await startOAuthFlow({
          redirectUrl: Linking.createURL("/", { scheme: "suwa" }),
        });
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
        }
      }}
    >
      {label}
    </ActionButton>
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const {
    signIn,
    errors: signInErrors,
    fetchStatus: signInStatus,
  } = useSignIn();
  const {
    signUp,
    errors: signUpErrors,
    fetchStatus: signUpStatus,
  } = useSignUp();
  const [step, setStep] = useState<Step>("start");
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setStep("profile");
    }
  }, [isLoaded, isSignedIn]);
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [patientForm, setPatientForm] = useState<PatientForm>({
    alias: "",
    email: "",
    phone: "",
    fullName: "",
    address: "",
  });
  useQuery(
    orpc.getPatientProfile.queryOptions({
      enabled: isLoaded && isSignedIn,
      retry: false,
      meta: { ignoreError: true },
    })
  );
  const completeOnboarding = useMutation(
    orpc.completeOnboarding.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        router.replace("/(patient)");
      },
    })
  );
  const needsCode =
    mode === "sign-up"
      ? signUp.status === "missing_requirements" &&
        signUp.unverifiedFields.includes("email_address") &&
        signUp.missingFields.length === 0
      : signIn.status === "needs_second_factor" ||
        signIn.status === "needs_client_trust";
  const currentFlow = useMemo(
    () => (step === "profile" ? "profile" : step === "auth" ? "auth" : "start"),
    [step]
  );
  const submitAuth = async () => {
    setStatusMessage(null);
    const result =
      mode === "sign-in"
        ? await signIn.password({ emailAddress, password })
        : await signUp.password({ emailAddress, password });
    if (result.error) {
      setStatusMessage(
        result.error.longMessage ?? `Unable to ${mode.replace("-", " ")}.`
      );
      return;
    }
    if (mode === "sign-up") {
      await signUp.verifications.sendEmailCode();
      setStep("profile");
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
    }
  };
  const verifyCode = async () => {
    setStatusMessage(null);
    if (mode === "sign-in") {
      await signIn.mfa.verifyEmailCode({ code });
    } else {
      await signUp.verifications.verifyEmailCode({ code });
    }
  };
  const submitOnboarding = async () => {
    const secret = generateUserSecret();
    await storeSecret(secret);
    const securedData = await encryptData(
      {
        email: patientForm.email ?? "",
        phone: patientForm.phone ?? "",
        fullName: patientForm.fullName ?? "",
        address: patientForm.address ?? "",
      },
      secret
    );
    completeOnboarding.mutate({
      alias: patientForm.alias,
      _securedData: securedData,
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex flex-1 justify-center">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
        >
          {currentFlow === "start" ? (
            <View className="gap-8 px-8">
              <Image
                resizeMode="contain"
                source={require("@/assets/images/icon-stripped.png")}
                style={{ height: 220, width: 120 }}
              />
              <View className="gap-6">
                <Text className="font-serif text-display text-foreground">
                  Suwa
                </Text>
                <View>
                  <Text className="font-sans text-foreground text-sub-display leading-tight">
                    Your health.
                  </Text>
                  <Text className="font-sans text-foreground text-sub-display leading-tight">
                    Your privacy.
                  </Text>
                  <Text className="font-sans font-semibold text-accent text-sub-display leading-tight">
                    Always.
                  </Text>
                </View>
                <View className="h-1 w-12 bg-accent" />
              </View>
              <Text className="max-w-60 font-sans text-body text-foreground leading-relaxed">
                Anonymous by design.{"\n"}Care that understands.
              </Text>
              <Pressable
                className="flex-row items-center justify-between gap-4 rounded-full bg-primary px-8 py-5 font-sans text-primary-foreground"
                onPress={() => setStep("auth")}
              >
                <Text className="font-medium font-sans text-base text-primary-foreground">
                  Begin your journey
                </Text>
                <ArrowRight />
              </Pressable>
            </View>
          ) : currentFlow === "auth" ? (
            <View className="gap-8 px-8">
              <View className="gap-6">
                <Text className="font-serif text-display text-foreground">
                  {mode === "sign-in" ? "Sign in" : "Sign up"}
                </Text>
                <View className="h-1 w-12 bg-accent" />
              </View>
              <View className="gap-4">
                <View className="flex-row gap-3">
                  <Pressable
                    className={`rounded-full border-2 px-4 py-2 ${mode === "sign-up" ? "border-primary bg-primary" : "border-border bg-secondary"}`}
                    onPress={() => {
                      setMode("sign-in");
                      setStatusMessage(null);
                    }}
                  >
                    <Text
                      className={`font-medium font-sans text-sm ${mode === "sign-up" ? "text-primary-foreground" : "text-foreground"}`}
                    >
                      Sign in
                    </Text>
                  </Pressable>
                  <Pressable
                    className={`rounded-full border-2 px-4 py-2 ${mode === "sign-in" ? "border-primary bg-primary" : "border-border bg-secondary"}`}
                    onPress={() => {
                      setMode("sign-up");
                      setStatusMessage(null);
                    }}
                  >
                    <Text
                      className={`font-medium font-sans text-sm ${mode === "sign-in" ? "text-primary-foreground" : "text-foreground"}`}
                    >
                      Sign up
                    </Text>
                  </Pressable>
                </View>

                <Field
                  autoCapitalize="none"
                  autoComplete="email"
                  error={
                    mode === "sign-in"
                      ? signInErrors.fields.identifier?.message
                      : signUpErrors.fields.emailAddress?.message
                  }
                  keyboardType="email-address"
                  label="Email address"
                  onChangeText={setEmailAddress}
                  value={emailAddress}
                />
                <Field
                  error={
                    mode === "sign-in"
                      ? signInErrors.fields.password?.message
                      : signUpErrors.fields.password?.message
                  }
                  label="Password"
                  onChangeText={setPassword}
                  secureTextEntry
                  value={password}
                />
                {statusMessage ? (
                  <Text className="font-sans text-destructive text-sm">
                    {statusMessage}
                  </Text>
                ) : null}
                {needsCode ? (
                  <Field
                    autoComplete="one-time-code"
                    error={
                      mode === "sign-in"
                        ? signInErrors.fields.code?.message
                        : signUpErrors.fields.code?.message
                    }
                    keyboardType="numeric"
                    label="Verification code"
                    onChangeText={setCode}
                    value={code}
                  />
                ) : null}
                {needsCode ? (
                  <ActionButton
                    disabled={
                      (mode === "sign-in" ? signInStatus : signUpStatus) ===
                      "fetching"
                    }
                    onPress={verifyCode}
                  >
                    Verify
                  </ActionButton>
                ) : (
                  <ActionButton
                    disabled={
                      (mode === "sign-in" ? signInStatus : signUpStatus) ===
                      "fetching"
                    }
                    onPress={submitAuth}
                  >
                    {mode === "sign-in" ? "Sign in" : "Sign up"}
                  </ActionButton>
                )}
              </View>
              <View className="gap-4">
                <View className="h-px bg-border" />
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <OAuthButton label="Google" strategy="oauth_google" />
                  </View>
                  <View className="flex-1">
                    <OAuthButton label="Facebook" strategy="oauth_facebook" />
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View className="gap-8 px-8">
              <View className="gap-6">
                <Text className="font-serif text-display text-foreground leading-none">
                  Finish setup
                </Text>
                <View className="h-1 w-12 bg-accent" />
              </View>
              <View className="gap-4">
                <Field
                  label="Alias"
                  onChangeText={(alias: string) =>
                    setPatientForm((value) => ({ ...value, alias }))
                  }
                  value={patientForm.alias}
                />
                <Field
                  autoCapitalize="none"
                  keyboardType="email-address"
                  label="Email"
                  onChangeText={(email: string) =>
                    setPatientForm((value) => ({ ...value, email }))
                  }
                  value={patientForm.email ?? ""}
                />
                <Field
                  keyboardType="phone-pad"
                  label="Phone"
                  onChangeText={(phone: string) =>
                    setPatientForm((value) => ({ ...value, phone }))
                  }
                  value={patientForm.phone ?? ""}
                />
                <Field
                  label="Full name"
                  onChangeText={(fullName: string) =>
                    setPatientForm((value) => ({ ...value, fullName }))
                  }
                  value={patientForm.fullName ?? ""}
                />
                <Field
                  label="Address"
                  onChangeText={(address: string) =>
                    setPatientForm((value) => ({ ...value, address }))
                  }
                  value={patientForm.address ?? ""}
                />
                <ActionButton
                  disabled={completeOnboarding.isPending || !patientForm.alias}
                  onPress={submitOnboarding}
                >
                  {completeOnboarding.isPending
                    ? "Setting up..."
                    : "Complete setup"}
                </ActionButton>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}
