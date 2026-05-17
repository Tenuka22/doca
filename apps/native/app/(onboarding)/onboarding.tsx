import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, Text, TextInput, View } from "react-native";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { orpc } from "@/utils/orpc";

type OnboardingMode = "self" | "has_guardian" | "guardian" | null;

interface SelectableCardProps {
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
  title: string;
}

function SelectableCard({
  icon,
  title,
  description,
  onPress,
}: SelectableCardProps) {
  return (
    <Pressable className="active:opacity-80" onPress={onPress}>
      <Card className="flex-row items-center gap-card p-card">
        <View className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {icon}
        </View>
        <View className="flex-1">
          <Text className="font-medium font-sans text-foreground text-lg">
            {title}
          </Text>
          <Text className="mt-1 font-normal font-sans text-muted-foreground text-sm leading-5">
            {description}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const selfSchema = z.object({
  alias: z.string().min(1, "Alias is required"),
});

const hasGuardianSchema = z.object({
  alias: z.string().min(1, "Alias is required"),
  guardianEmail: z.string().email("Valid email required"),
  guardianPhone: z.string().min(1, "Phone is required"),
});

const guardianSchema = z.object({
  alias: z.string().min(1, "Alias is required"),
  guardianEmail: z.string().email("Valid email required"),
});

type SelfForm = z.infer<typeof selfSchema>;
type HasGuardianForm = z.infer<typeof hasGuardianSchema>;
type GuardianForm = z.infer<typeof guardianSchema>;

export default function OnboardingScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<OnboardingMode>(null);
  const [step, setStep] = useState<"select" | "form">("select");

  const selfForm = useForm<SelfForm>({
    defaultValues: { alias: "" },
  });

  const hasGuardianForm = useForm<HasGuardianForm>({
    defaultValues: { alias: "", guardianEmail: "", guardianPhone: "" },
  });

  const guardianForm = useForm<GuardianForm>({
    defaultValues: { alias: "", guardianEmail: "" },
  });

  const pendingGuardiansQuery = useQuery({
    queryKey: orpc.getPendingGuardianRequests.queryKey(),
    queryFn: () => orpc.getPendingGuardianRequests.call(),
    enabled: mode === "guardian",
  });

  const completeOnboarding = useMutation(
    orpc.completeOnboarding.mutationOptions({
      onSuccess: () => {
        router.replace("/");
      },
    })
  );

  const handleModeSelect = (
    selectedMode: "self" | "has_guardian" | "guardian"
  ) => {
    setMode(selectedMode);
    setStep("form");
  };

  const onSelfSubmit = (data: SelfForm) => {
    completeOnboarding.mutate({
      mode: "self",
      alias: data.alias,
    });
  };

  const onHasGuardianSubmit = (data: HasGuardianForm) => {
    completeOnboarding.mutate({
      mode: "has_guardian",
      alias: data.alias,
      guardianEmail: data.guardianEmail,
      guardianPhone: data.guardianPhone,
    });
  };

  const onGuardianSubmit = (data: GuardianForm) => {
    completeOnboarding.mutate({
      mode: "guardian",
      alias: data.alias,
      guardianEmail: data.guardianEmail,
    });
  };

  const handleApproveGuardian = useMutation(
    orpc.approveGuardianRequest.mutationOptions({
      onSuccess: () => {
        pendingGuardiansQuery.refetch();
      },
    })
  );

  if (step === "select") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="flex-1 justify-center gap-section px-page py-page">
          <View className="gap-section">
            <View className="gap-chip">
              <Text className="font-medium font-sans text-primary text-sm uppercase tracking-[0.25em]">
                Welcome to ZenDoc
              </Text>
              <Text className="font-medium font-sans text-4xl text-foreground leading-tight">
                Who are you signing up for?
              </Text>
            </View>
            <Text className="font-normal font-sans text-base text-muted-foreground leading-6">
              Choose how you want to use ZenDoc
            </Text>
          </View>
          <View className="gap-chip">
            <SelectableCard
              description="Manage your own appointments, medical records, and daily wellness tracking in one place."
              icon={<FontAwesome color="#0f172a" name="user" size={32} />}
              onPress={() => handleModeSelect("self")}
              title="Manage for myself"
            />
            <SelectableCard
              description="Set up a guardian to manage your healthcare and appointments on your behalf."
              icon={<FontAwesome color="#0f172a" name="user-plus" size={32} />}
              onPress={() => handleModeSelect("has_guardian")}
              title="I have a guardian"
            />
            <SelectableCard
              description="Act as a guardian to manage healthcare and appointments for a family member or dependent."
              icon={<FontAwesome color="#0f172a" name="users" size={32} />}
              onPress={() => handleModeSelect("guardian")}
              title="I'm a guardian"
            />
          </View>
        </Screen>
      </>
    );
  }

  if (mode === "self") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="flex-1 justify-between gap-section px-page py-page">
          <View className="gap-section">
            <View className="gap-chip">
              <Text className="font-medium font-sans text-primary text-sm uppercase tracking-[0.25em]">
                Your Profile
              </Text>
              <Text className="font-medium font-sans text-4xl text-foreground leading-tight">
                Tell us about yourself
              </Text>
            </View>
            <Controller
              control={selfForm.control}
              name="alias"
              render={({ field, fieldState }) => (
                <View className="gap-chip">
                  <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
                    Your Alias
                  </Text>
                  <TextInput
                    className="rounded-control border-2 border-border bg-background px-card py-control font-sans text-foreground"
                    onChangeText={field.onChange}
                    placeholder="Enter a nickname"
                    placeholderTextColor="#6b7280"
                    value={field.value}
                  />
                  {fieldState.error && (
                    <Text className="font-medium font-sans text-destructive text-sm">
                      {fieldState.error.message}
                    </Text>
                  )}
                  <Text className="font-normal font-sans text-muted-foreground text-xs">
                    This is how you will appear to doctors. It can be any name
                    you choose.
                  </Text>
                </View>
              )}
            />
          </View>
          <View className="gap-chip">
            <Button
              disabled={
                completeOnboarding.isPending || !selfForm.watch("alias")
              }
              onPress={selfForm.handleSubmit(onSelfSubmit)}
            >
              {completeOnboarding.isPending ? "Setting up..." : "Continue"}
            </Button>
            <Button
              onPress={() => {
                setMode(null);
                setStep("select");
              }}
              variant="secondary"
            >
              Back
            </Button>
          </View>
        </Screen>
      </>
    );
  }

  if (mode === "has_guardian") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentClassName="flex-1 justify-between gap-section px-page py-page">
          <View className="gap-section">
            <View className="gap-chip">
              <Text className="font-medium font-sans text-primary text-sm uppercase tracking-[0.25em]">
                Guardian Setup
              </Text>
              <Text className="font-medium font-sans text-4xl text-foreground leading-tight">
                Set up your guardian
              </Text>
            </View>
            <Controller
              control={hasGuardianForm.control}
              name="alias"
              render={({ field, fieldState }) => (
                <View className="gap-chip">
                  <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
                    Your Alias
                  </Text>
                  <TextInput
                    className="rounded-control border-2 border-border bg-background px-card py-control font-sans text-foreground"
                    onChangeText={field.onChange}
                    placeholder="Enter a nickname"
                    placeholderTextColor="#6b7280"
                    value={field.value}
                  />
                  {fieldState.error && (
                    <Text className="font-medium font-sans text-destructive text-sm">
                      {fieldState.error.message}
                    </Text>
                  )}
                </View>
              )}
            />
            <Controller
              control={hasGuardianForm.control}
              name="guardianEmail"
              render={({ field, fieldState }) => (
                <View className="gap-chip">
                  <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
                    Guardian Email
                  </Text>
                  <TextInput
                    autoCapitalize="none"
                    className="rounded-control border-2 border-border bg-background px-card py-control font-sans text-foreground"
                    keyboardType="email-address"
                    onChangeText={field.onChange}
                    placeholder="guardian@example.com"
                    placeholderTextColor="#6b7280"
                    value={field.value}
                  />
                  {fieldState.error && (
                    <Text className="font-medium font-sans text-destructive text-sm">
                      {fieldState.error.message}
                    </Text>
                  )}
                </View>
              )}
            />
            <Controller
              control={hasGuardianForm.control}
              name="guardianPhone"
              render={({ field, fieldState }) => (
                <View className="gap-chip">
                  <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
                    Guardian Phone
                  </Text>
                  <TextInput
                    className="rounded-control border-2 border-border bg-background px-card py-control font-sans text-foreground"
                    keyboardType="phone-pad"
                    onChangeText={field.onChange}
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor="#6b7280"
                    value={field.value}
                  />
                  {fieldState.error && (
                    <Text className="font-medium font-sans text-destructive text-sm">
                      {fieldState.error.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>
          <View className="gap-chip">
            <Button
              disabled={
                completeOnboarding.isPending ||
                !hasGuardianForm.formState.isValid
              }
              onPress={hasGuardianForm.handleSubmit(onHasGuardianSubmit)}
            >
              {completeOnboarding.isPending ? "Setting up..." : "Continue"}
            </Button>
            <Button
              onPress={() => {
                setMode(null);
                setStep("select");
              }}
              variant="secondary"
            >
              Back
            </Button>
          </View>
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="flex-1 justify-between gap-section px-page py-page">
        <View className="gap-section">
          <View className="gap-chip">
            <Text className="font-medium font-sans text-primary text-sm uppercase tracking-[0.25em]">
              Guardian Setup
            </Text>
            <Text className="font-medium font-sans text-4xl text-foreground leading-tight">
              Set up your guardian profile
            </Text>
          </View>
          <Controller
            control={guardianForm.control}
            name="alias"
            render={({ field, fieldState }) => (
              <View className="gap-chip">
                <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
                  Your Alias
                </Text>
                <TextInput
                  className="rounded-control border-2 border-border bg-background px-card py-control font-sans text-foreground"
                  onChangeText={field.onChange}
                  placeholder="Enter a nickname"
                  placeholderTextColor="#6b7280"
                  value={field.value}
                />
                {fieldState.error && (
                  <Text className="font-medium font-sans text-destructive text-sm">
                    {fieldState.error.message}
                  </Text>
                )}
                <Text className="font-normal font-sans text-muted-foreground text-xs">
                  This is how patients will identify you.
                </Text>
              </View>
            )}
          />
          <Controller
            control={guardianForm.control}
            name="guardianEmail"
            render={({ field, fieldState }) => (
              <View className="gap-chip">
                <Text className="font-medium font-sans text-foreground text-sm uppercase tracking-[0.18em]">
                  Your Email
                </Text>
                <TextInput
                  autoCapitalize="none"
                  className="rounded-control border-2 border-border bg-background px-card py-control font-sans text-foreground"
                  keyboardType="email-address"
                  onChangeText={field.onChange}
                  placeholder="guardian@example.com"
                  placeholderTextColor="#6b7280"
                  value={field.value}
                />
                {fieldState.error && (
                  <Text className="font-medium font-sans text-destructive text-sm">
                    {fieldState.error.message}
                  </Text>
                )}
              </View>
            )}
          />
          {pendingGuardiansQuery.data?.requests?.length ? (
            <View className="gap-chip">
              <Text className="font-medium font-sans text-foreground text-lg">
                Pending Requests
              </Text>
              {pendingGuardiansQuery.data.requests.map((req) => (
                <Card key={req.userId}>
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="font-medium text-foreground">
                        {req.alias}
                      </Text>
                      <Text className="text-muted-foreground text-sm">
                        {req.guardianEmail} • {req.guardianPhone}
                      </Text>
                    </View>
                    <Button
                      onPress={() =>
                        handleApproveGuardian.mutate({
                          patientUserId: req.userId,
                        })
                      }
                    >
                      Approve
                    </Button>
                  </View>
                </Card>
              ))}
            </View>
          ) : null}
        </View>
        <View className="gap-chip">
          <Button
            disabled={
              completeOnboarding.isPending || !guardianForm.formState.isValid
            }
            onPress={guardianForm.handleSubmit(onGuardianSubmit)}
          >
            {completeOnboarding.isPending ? "Setting up..." : "Continue"}
          </Button>
          <Button
            onPress={() => {
              setMode(null);
              setStep("select");
            }}
            variant="secondary"
          >
            Back
          </Button>
        </View>
      </Screen>
    </>
  );
}
