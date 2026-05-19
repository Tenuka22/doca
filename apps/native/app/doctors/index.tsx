import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import {
  ArrowRight,
  Languages,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react-native";
import { useState } from "react";
import { Image, Text, useColorScheme, View } from "react-native";

import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { useDoctorMaterialPreviewUrl } from "@/utils/doctor-materials";
import { orpc } from "@/utils/orpc";

const listChips = [
  { label: "Licensed", value: "license" },
  { label: "Video consult", value: "video" },
  { label: "In person", value: "in_person" },
  { label: "Chat support", value: "chat" },
  { label: "English", value: "english" },
  { label: "Family", value: "family" },
] as const;

export default function DoctorsScreen() {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#fafafa" : "#09090b";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const doctorsQuery = useQuery({
    queryKey: ["doctors", page, search],
    queryFn: () => orpc.listDoctors.call({ page, pageSize, search }),
  });

  const doctors = doctorsQuery.data?.doctors ?? [];
  const hasMore = doctorsQuery.data?.hasMore ?? false;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen contentClassName="gap-6 px-page py-page">
        <View className="gap-3">
          <Text className="font-black font-sans text-4xl text-foreground uppercase tracking-tight">
            Doctors
          </Text>
          <Text className="max-w-[340px] font-bold font-sans text-muted-foreground text-sm leading-relaxed">
            Browse public doctor profiles, tap into a name, and see who each
            licensed clinician is.
          </Text>
        </View>

        <Card className="gap-4">
          <View className="flex-row items-center gap-3">
            <Search color={iconColor} size={18} />
            <Text className="font-bold font-sans text-foreground text-sm">
              Public directory
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            <View className="rounded-full border-2 border-border bg-background px-3 py-1">
              <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wide">
                Licensed
              </Text>
            </View>
            <View className="rounded-full border-2 border-border bg-background px-3 py-1">
              <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wide">
                Anonymous friendly
              </Text>
            </View>
          </View>
        </Card>

        <View className="flex-row flex-wrap gap-2">
          {listChips.map((chip) => (
            <Card
              className="px-3 py-2"
              key={chip.value}
              onPress={() => {
                setSearch(chip.value);
                setPage(1);
              }}
            >
              <Text className="font-bold font-sans text-[10px] text-foreground uppercase tracking-wide">
                {chip.label}
              </Text>
            </Card>
          ))}
        </View>

        <Card className="gap-3">
          <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-wide">
            Search doctors
          </Text>
          <Card className="px-3 py-3">
            <Text className="font-medium font-sans text-foreground text-sm">
              {search || "Tap a filter chip to narrow results"}
            </Text>
          </Card>
          <ButtonRow
            onClear={() => {
              setSearch("");
              setPage(1);
            }}
          />
        </Card>

        <View className="gap-4">
          {doctors.length === 0 ? (
            <Card>
              <Text className="font-bold font-sans text-base text-foreground">
                No doctors published yet.
              </Text>
              <Text className="font-medium font-sans text-muted-foreground text-sm">
                Once doctor profiles exist, they will appear here automatically.
              </Text>
            </Card>
          ) : null}

          {doctors.map(({ profile, portrait }) => (
            <Card
              className="gap-4"
              href={`/doctors/${profile.userId}`}
              key={profile.userId}
            >
              <View className="flex-row items-start gap-4">
                <PortraitThumb
                  iconColor={iconColor}
                  id={portrait?.id ?? null}
                />

                <View className="flex-1 gap-2">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="flex-1 font-black font-sans text-foreground text-xl">
                      {profile.displayName ??
                        profile.headline ??
                        profile.licenseNumber ??
                        profile.placeName ??
                        "Doctor profile"}
                    </Text>
                    <ArrowRight color="#09090b" size={16} />
                  </View>

                  <Text className="font-bold font-sans text-muted-foreground text-sm">
                    {profile.headline ??
                      profile.approach ??
                      "Licensed care, private by design."}
                  </Text>

                  <View className="flex-row flex-wrap gap-2">
                    {profile.specialties?.[0] ? (
                      <View className="flex-row items-center gap-1 rounded-full border-2 border-border bg-background px-2 py-1">
                        <Sparkles color={iconColor} size={12} />
                        <Text className="font-bold font-sans text-[10px] text-foreground uppercase tracking-wide">
                          {profile.specialties[0]}
                        </Text>
                      </View>
                    ) : null}
                    {profile.location ? (
                      <View className="flex-row items-center gap-1 rounded-full border-2 border-border bg-background px-2 py-1">
                        <MapPin color={iconColor} size={12} />
                        <Text className="font-bold font-sans text-[10px] text-foreground uppercase tracking-wide">
                          {profile.location}
                        </Text>
                      </View>
                    ) : null}
                    {profile.consultationModes?.[0] ? (
                      <View className="flex-row items-center gap-1 rounded-full border-2 border-border bg-background px-2 py-1">
                        <Languages color={iconColor} size={12} />
                        <Text className="font-bold font-sans text-[10px] text-foreground uppercase tracking-wide">
                          {profile.consultationModes[0]}
                        </Text>
                      </View>
                    ) : null}
                    {profile.education ? (
                      <View className="flex-row items-center gap-1 rounded-full border-2 border-border bg-background px-2 py-1">
                        <Sparkles color={iconColor} size={12} />
                        <Text className="font-bold font-sans text-[10px] text-foreground uppercase tracking-wide">
                          Education
                        </Text>
                      </View>
                    ) : null}
                    {portrait ? (
                      <View className="flex-row items-center gap-1 rounded-full border-2 border-border bg-background px-2 py-1">
                        <Sparkles color={iconColor} size={12} />
                        <Text className="font-bold font-sans text-[10px] text-foreground uppercase tracking-wide">
                          Profile media
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <View className="flex-row items-center justify-between gap-3">
          <Card
            className="flex-1 py-2"
            onPress={() => setPage((current) => Math.max(1, current - 1))}
          >
            <Text className="text-center font-bold font-sans text-foreground text-xs uppercase tracking-wide">
              Previous
            </Text>
          </Card>
          <Card
            className="flex-1 py-2"
            onPress={() => hasMore && setPage((current) => current + 1)}
          >
            <Text className="text-center font-bold font-sans text-foreground text-xs uppercase tracking-wide">
              Next
            </Text>
          </Card>
        </View>
      </Screen>
    </>
  );
}

function ButtonRow({ onClear }: { onClear: () => void }) {
  return (
    <Card className="px-3 py-2" onPress={onClear}>
      <Text className="font-bold font-sans text-[10px] text-foreground uppercase tracking-wide">
        Clear filters
      </Text>
    </Card>
  );
}

function PortraitThumb({
  id,
  iconColor,
}: {
  id: string | null;
  iconColor: string;
}) {
  const previewUrl = useDoctorMaterialPreviewUrl(id);

  if (previewUrl) {
    return (
      <Image
        className="h-14 w-14 rounded-2xl border-2 border-border"
        source={{ uri: previewUrl }}
      />
    );
  }

  return (
    <View className="h-14 w-14 items-center justify-center rounded-2xl border-2 border-border bg-primary">
      <Sparkles color={iconColor} size={22} />
    </View>
  );
}
