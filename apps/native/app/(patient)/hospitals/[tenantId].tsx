"use client";

import { useQuery } from "@tanstack/react-query";
import { type Href, Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Building2,
  Clock,
  Globe,
  Hospital as HospitalIcon,
  MapPin,
  Phone,
  Stethoscope,
} from "lucide-react-native";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { Tag } from "@/components/ui/tag";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";
import { IconButton } from "@/components/ui/icon-button";

export default function HospitalDetailScreen() {
  const colors = useThemeColor();
  const router = useRouter();
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();

  const detailQuery = useQuery(
    orpc.getTenantDetail.queryOptions({
      input: { tenantId: tenantId ?? "" },
    })
  );

  const tenant = detailQuery.data?.tenant ?? null;
  const clinics = detailQuery.data?.clinics ?? [];
  const affiliatedDoctors = detailQuery.data?.affiliatedDoctors ?? [];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen>
        <ScrollView
          className="flex-1 px-4 pt-16"
          contentContainerClassName="gap-6 pb-32"
        >
          {detailQuery.isPending && (
            <View className="flex-1 items-center justify-center pt-20">
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          )}

          {!(detailQuery.isPending || tenant) && (
            <View className="flex-1 items-center justify-center pt-20">
              <Text className="font-medium font-sans text-muted-foreground text-sm">
                Hospital not found
              </Text>
            </View>
          )}

          {tenant && (
            <>
              {/* Header */}
              <View className="gap-4">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 gap-2 pr-4">
                    <Text className="font-black font-sans text-2xl text-foreground uppercase leading-tight tracking-tight">
                      {tenant.name}
                    </Text>
                    <Tag size="sm" variant="primary">
                      {tenant.type === "PRIVATE_HOSPITAL"
                        ? "Private Hospital"
                        : "Public Hospital"}
                    </Tag>
                  </View>
                </View>

                {/* Address */}
                <View className="flex-row items-start gap-2">
                  <MapPin
                    color={colors.mutedForeground}
                    size={16}
                    strokeWidth={2}
                  />
                  <Text className="flex-1 font-medium font-sans text-muted-foreground text-sm leading-snug">
                    {tenant.address}
                  </Text>
                </View>

                {tenant.phone && (
                  <Pressable
                    className="flex-row items-center gap-2"
                    onPress={() => Linking.openURL(`tel:${tenant.phone}`)}
                  >
                    <Phone color={colors.primary} size={16} strokeWidth={2} />
                    <Text className="font-medium font-sans text-primary text-sm">
                      {tenant.phone}
                    </Text>
                  </Pressable>
                )}

                {tenant.website && (
                  <Pressable
                    className="flex-row items-center gap-2"
                    onPress={() => {
                      if (tenant.website) {
                        Linking.openURL(tenant.website);
                      }
                    }}
                  >
                    <Globe color={colors.primary} size={16} strokeWidth={2} />
                    <Text
                      className="flex-1 font-medium font-sans text-primary text-sm"
                      numberOfLines={1}
                    >
                      {tenant.website}
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Stats bar */}
              <View className="flex-row gap-3">
                <View className="flex-1 items-center rounded-xl border-2 border-border bg-card p-3">
                  <Text className="font-black font-sans text-foreground text-xl">
                    {clinics.length}
                  </Text>
                  <Text className="font-bold font-sans text-[9px] text-muted-foreground uppercase tracking-widest">
                    Clinics
                  </Text>
                </View>
                <View className="flex-1 items-center rounded-xl border-2 border-border bg-card p-3">
                  <Text className="font-black font-sans text-foreground text-xl">
                    {affiliatedDoctors.length}
                  </Text>
                  <Text className="font-bold font-sans text-[9px] text-muted-foreground uppercase tracking-widest">
                    Doctors
                  </Text>
                </View>
              </View>

              {/* Services */}
              {tenant.services.length > 0 && (
                <View className="gap-3">
                  <View className="flex-row items-center gap-2">
                    <Building2
                      color={colors.mutedForeground}
                      size={14}
                      strokeWidth={2}
                    />
                    <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
                      Services
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-1.5">
                    {tenant.services.map((service) => (
                      <Tag key={service} size="sm" variant="secondary">
                        {service}
                      </Tag>
                    ))}
                  </View>
                </View>
              )}

              {/* Clinics */}
              <View className="gap-3">
                <View className="flex-row items-center gap-2">
                  <HospitalIcon
                    color={colors.mutedForeground}
                    size={14}
                    strokeWidth={2}
                  />
                  <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
                    Clinics
                  </Text>
                </View>
                {clinics.length === 0 && (
                  <View className="rounded-xl border-2 border-border bg-background p-4">
                    <Text className="text-center font-medium font-sans text-muted-foreground text-xs">
                      No clinics registered yet
                    </Text>
                  </View>
                )}
                {clinics.map((clinic) => (
                  <View
                    className="rounded-xl border-2 border-border bg-card p-4"
                    key={clinic.id}
                  >
                    <View className="gap-2">
                      <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-tight">
                        {clinic.name}
                      </Text>
                      {clinic.specialization && (
                        <Tag size="sm" variant="muted">
                          {clinic.specialization}
                        </Tag>
                      )}
                      {clinic.schedule && (
                        <View className="flex-row items-start gap-1.5">
                          <Clock
                            color={colors.mutedForeground}
                            size={12}
                            strokeWidth={2}
                          />
                          <Text className="flex-1 font-medium font-sans text-muted-foreground text-xs leading-snug">
                            {clinic.schedule}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Affiliated Doctors */}
              <View className="gap-3">
                <View className="flex-row items-center gap-2">
                  <Stethoscope
                    color={colors.mutedForeground}
                    size={14}
                    strokeWidth={2}
                  />
                  <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
                    Doctors
                  </Text>
                </View>
                {affiliatedDoctors.length === 0 && (
                  <View className="rounded-xl border-2 border-border bg-background p-4">
                    <Text className="text-center font-medium font-sans text-muted-foreground text-xs">
                      No doctors affiliated yet
                    </Text>
                  </View>
                )}
                {affiliatedDoctors.map((doc) => (
                  <Pressable
                    className="flex-row items-center gap-3 rounded-xl border-2 border-border bg-card p-4"
                    key={doc.doctorId}
                    onPress={() =>
                      router.push(`/doctors/${doc.doctorId}` as Href)
                    }
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                      <Stethoscope
                        color={colors.primary}
                        size={18}
                        strokeWidth={2}
                      />
                    </View>
                    <View className="flex-1 gap-1">
                      <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-tight">
                        {doc.profile.displayName}
                      </Text>
                      {doc.profile.headline && (
                        <Text
                          className="font-medium font-sans text-muted-foreground text-xs"
                          numberOfLines={1}
                        >
                          {doc.profile.headline}
                        </Text>
                      )}
                      <View className="flex-row flex-wrap gap-1">
                        {doc.profile.specialties.slice(0, 3).map((s) => (
                          <Tag key={s} size="sm" variant="muted">
                            {s}
                          </Tag>
                        ))}
                      </View>
                    </View>
                    <ArrowLeft
                      color={colors.mutedForeground}
                      size={14}
                      strokeWidth={2.5}
                      style={{ transform: [{ rotate: "180deg" }] }}
                    />
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </Screen>

      <ScreenBottomBar>
        <Button
          className="flex-1"
          onPress={() => router.push("/map" as Href)}
          size="sm"
          variant="primary"
        >
          <Text className="font-bold font-sans text-[10px] text-primary-foreground uppercase">
            Back to Map
          </Text>
        </Button>

        {tenant?.phone && (

          <IconButton
            icon={Phone}
            iconSize={16}

            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
            />
        )}

        <IconButton
          icon={ArrowLeft}
          iconSize={16}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/");
            }
          }}
        />
      </ScreenBottomBar>
    </>
  );
}
