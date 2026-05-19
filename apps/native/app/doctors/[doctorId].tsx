import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Camera,
  FileText,
  Languages,
  MapPin,
  School2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Video,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Image, Pressable, Text, useColorScheme, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { useDoctorMaterialPreviewUrl } from "@/utils/doctor-materials";
import { orpc } from "@/utils/orpc";

interface DoctorProfileView {
  approach: string | null;
  approachSteps: { id: string; text: string }[];
  bio: string | null;
  consultationModes: string[];
  createdAt: string;
  displayName: string | null;
  education: string | null;
  experienceStartYear: number | null;
  focusAreas: string[];
  headline: string | null;
  languages: string[];
  licenseNumber: string | null;
  location: string | null;
  placeAddress: string | null;
  placeDescription: string | null;
  placeName: string | null;
  specialties: string[];
  stripeAccountEnabled: boolean | null;
}

interface DoctorFileView {
  caption: string | null;
  fileKind: string;
  fileName: string;
  id: string;
}

interface DoctorEducationView {
  degree: string;
  id: string;
  institution: string;
  year: number | null;
}

function capitalizeWords(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getYearsOfExperience(startYear: number | null) {
  if (!startYear) {
    return null;
  }

  const years = new Date().getFullYear() - startYear;
  return years > 0 ? years : null;
}

export default function DoctorProfileScreen() {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#fafafa" : "#09090b";
  const [isFavorite, setIsFavorite] = useState(false);
  const router = useRouter();
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const id = Array.isArray(doctorId) ? doctorId[0] : doctorId;
  const doctorQuery = useQuery({
    queryKey: ["doctor", id],
    queryFn: () => orpc.getDoctor.call({ doctorId: id ?? "" }),
    enabled: !!id,
  });

  const profile = doctorQuery.data?.profile;
  const files = doctorQuery.data?.files ?? [];
  const education = doctorQuery.data?.education ?? [];
  const portraitId = doctorQuery.data?.portrait?.id ?? null;
  const portraitPreviewUrl = useDoctorMaterialPreviewUrl(portraitId);
  const yearsOfExperience = useMemo(
    () => getYearsOfExperience(profile?.experienceStartYear ?? null),
    [profile?.experienceStartYear]
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen contentClassName="gap-6 px-page py-page">
        <View className="flex-row items-center justify-between">
          <Button onPress={() => router.back()} size="sm" variant="secondary">
            <View className="flex-row items-center gap-2">
              <ArrowLeft color={iconColor} size={16} />
              <Text className="font-bold font-sans text-foreground text-sm">
                Back
              </Text>
            </View>
          </Button>
        </View>

        {profile ? (
          <>
            <ProfileOverview
              iconColor={iconColor}
              isFavorite={isFavorite}
              onToggleFavorite={() => setIsFavorite((current) => !current)}
              portraitPreviewUrl={portraitPreviewUrl}
              profile={profile}
              yearsOfExperience={yearsOfExperience}
            />
            <AtAGlance profile={profile} />
            <PracticeSection profile={profile} />
            <ApproachSection profile={profile} />
            <EducationSection education={education} />
            <ResourcesSection files={files} />
            <AboutSection profile={profile} />
          </>
        ) : (
          <Card className="gap-3">
            <Text className="font-black font-sans text-2xl text-foreground">
              Doctor not found
            </Text>
            <Text className="font-medium font-sans text-muted-foreground text-sm">
              That public profile does not exist yet.
            </Text>
          </Card>
        )}
      </Screen>
    </>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-start gap-3 rounded-2xl border-2 border-border bg-background p-3">
      <View className="mt-0.5">{icon}</View>
      <View className="flex-1 gap-1">
        <Text className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-wide">
          {label}
        </Text>
        <Text className="font-medium font-sans text-foreground text-sm leading-relaxed">
          {value}
        </Text>
      </View>
    </View>
  );
}

function ProfileOverview({
  iconColor,
  isFavorite,
  onToggleFavorite,
  portraitPreviewUrl,
  profile,
  yearsOfExperience,
}: {
  iconColor: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  portraitPreviewUrl: string | null;
  profile: DoctorProfileView;
  yearsOfExperience: number | null;
}) {
  return (
    <Card className="gap-4">
      <View className="flex-row items-start gap-4">
        {portraitPreviewUrl ? (
          <Image
            className="h-16 w-16 rounded-2xl border-2 border-border"
            source={{ uri: portraitPreviewUrl }}
          />
        ) : (
          <View className="h-16 w-16 items-center justify-center rounded-2xl border-2 border-border bg-primary">
            <BadgeCheck color={iconColor} size={24} />
          </View>
        )}

        <View className="flex-1 gap-2">
          <Text className="font-black font-sans text-3xl text-foreground">
            {profile.displayName ??
              profile.headline ??
              profile.licenseNumber ??
              profile.placeName ??
              "Doctor profile"}
          </Text>
          <Text className="font-bold font-sans text-muted-foreground text-sm">
            {profile.headline ??
              profile.approach ??
              "Licensed care, private by design."}
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {profile.location ? (
              <View className="flex-row items-center gap-1 rounded-full border-2 border-border bg-background px-2 py-1">
                <MapPin color={iconColor} size={12} />
                <Text className="font-bold font-sans text-[10px] text-foreground uppercase tracking-wide">
                  {profile.location}
                </Text>
              </View>
            ) : null}
            {yearsOfExperience ? (
              <View className="flex-row items-center gap-1 rounded-full border-2 border-border bg-background px-2 py-1">
                <Stethoscope color={iconColor} fill={iconColor} size={12} />
                <Text className="font-bold font-sans text-[10px] text-foreground uppercase tracking-wide">
                  {yearsOfExperience}+ years
                </Text>
              </View>
            ) : null}
            {profile.stripeAccountEnabled ? (
              <View className="flex-row items-center gap-1 rounded-full border-2 border-border bg-background px-2 py-1">
                <ShieldCheck color={iconColor} size={12} />
                <Text className="font-bold font-sans text-[10px] text-foreground uppercase tracking-wide">
                  Verified payments
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          className="flex-1"
          onPress={onToggleFavorite}
        >
          {({ pressed }) => (
            <View
              className="rounded-2xl border-2 border-border bg-background px-4 py-3"
              style={{
                opacity: pressed ? 0.84 : 1,
                transform: [{ translateY: pressed ? 2 : 0 }],
              }}
            >
              <Text className="text-center font-bold font-sans text-foreground text-sm uppercase tracking-wide">
                {isFavorite ? "Saved" : "Save doctor"}
              </Text>
            </View>
          )}
        </Pressable>
        <Button className="flex-1" variant="secondary">
          Book consult
        </Button>
      </View>

      {profile.bio ? (
        <Text className="font-medium font-sans text-foreground text-sm leading-relaxed">
          {profile.bio}
        </Text>
      ) : null}
    </Card>
  );
}

function AtAGlance({ profile }: { profile: DoctorProfileView }) {
  const specialties =
    profile.specialties.map(capitalizeWords).join(", ") || "Not listed";
  const languages =
    profile.languages.map(capitalizeWords).join(", ") || "Not listed";
  const consultationModes =
    profile.consultationModes.map(capitalizeWords).join(", ") || "Not listed";
  const focusAreas =
    profile.focusAreas.map(capitalizeWords).join(", ") || "Not listed";

  return (
    <Card className="gap-4">
      <View className="flex-row items-center gap-2">
        <Sparkles color="#09090b" fill="#09090b" size={18} />
        <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
          At a glance
        </Text>
      </View>

      <View className="gap-3">
        <Row
          icon={<BookOpen color="#09090b" size={16} />}
          label="Specialties"
          value={specialties}
        />
        <Row
          icon={<Languages color="#09090b" size={16} />}
          label="Languages"
          value={languages}
        />
        <Row
          icon={<Video color="#09090b" size={16} />}
          label="Consultation"
          value={consultationModes}
        />
        <Row
          icon={<FileText color="#09090b" size={16} />}
          label="Focus areas"
          value={focusAreas}
        />
      </View>
    </Card>
  );
}

function PracticeSection({ profile }: { profile: DoctorProfileView }) {
  const rows = [
    { label: "Practice", value: profile.placeName ?? "Not listed" },
    {
      label: "Location",
      value: profile.placeAddress ?? profile.location ?? "Not listed",
    },
    { label: "Description", value: profile.placeDescription ?? "Not listed" },
    { label: "Joined", value: profile.createdAt.slice(0, 10) },
  ];

  return (
    <Card className="gap-4">
      <View className="flex-row items-center gap-2">
        <MapPin color="#09090b" fill="#09090b" size={18} />
        <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
          Practice
        </Text>
      </View>

      <View className="gap-3">
        {rows.map((row) => (
          <Row
            icon={<MapPin color="#09090b" size={16} />}
            key={row.label}
            label={row.label}
            value={row.value}
          />
        ))}
      </View>
    </Card>
  );
}

function ApproachSection({ profile }: { profile: DoctorProfileView }) {
  const steps = profile.approachSteps ?? [];

  return (
    <Card className="gap-4">
      <View className="flex-row items-center gap-2">
        <Sparkles color="#09090b" fill="#09090b" size={18} />
        <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
          Approach
        </Text>
      </View>

      {steps.length > 0 ? (
        <View className="gap-3">
          {steps.map((step, index) => (
            <View
              className="rounded-2xl border-2 border-border bg-background p-3"
              key={step.id}
            >
              <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wide">
                Step {index + 1}
              </Text>
              <Text className="font-medium font-sans text-foreground text-sm leading-relaxed">
                {step.text}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="font-medium font-sans text-foreground text-sm leading-relaxed">
          {profile.approach ?? "A calm, structured, and private care style."}
        </Text>
      )}
    </Card>
  );
}

function EducationSection({ education }: { education: DoctorEducationView[] }) {
  return (
    <Card className="gap-4">
      <View className="flex-row items-center gap-2">
        <School2 color="#09090b" fill="#09090b" size={18} />
        <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
          Education
        </Text>
      </View>

      {education.length === 0 ? (
        <Text className="font-medium font-sans text-muted-foreground text-sm">
          No education entries published yet.
        </Text>
      ) : (
        <View className="gap-3">
          {education.map((entry) => (
            <View
              className="gap-1 rounded-2xl border-2 border-border bg-background p-3"
              key={entry.id}
            >
              <Text className="font-bold font-sans text-foreground text-sm">
                {entry.degree}
              </Text>
              <Text className="font-medium font-sans text-muted-foreground text-sm">
                {entry.institution}
                {entry.year ? `, ${entry.year}` : ""}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function ResourcesSection({ files }: { files: DoctorFileView[] }) {
  const kindLabel = (kind: string) => {
    if (kind === "intro_video") {
      return "Intro video";
    }
    if (kind === "qualification") {
      return "Qualification";
    }
    if (kind === "portrait") {
      return "Portrait";
    }
    return capitalizeWords(kind);
  };

  return (
    <Card className="gap-4">
      <View className="flex-row items-center gap-2">
        <Camera color="#09090b" fill="#09090b" size={18} />
        <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
          Profile resources
        </Text>
      </View>

      {files.length === 0 ? (
        <Text className="font-medium font-sans text-muted-foreground text-sm">
          No resources uploaded yet.
        </Text>
      ) : (
        <View className="gap-3">
          {files.map((file) => (
            <View
              className="gap-1 rounded-2xl border-2 border-border bg-background p-3"
              key={file.id}
            >
              <Text className="font-bold font-sans text-foreground text-sm">
                {kindLabel(file.fileKind)}
              </Text>
              <Text className="font-medium font-sans text-muted-foreground text-sm">
                {file.caption ?? file.fileName}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function AboutSection({ profile }: { profile: DoctorProfileView }) {
  return (
    <Card className="gap-4">
      <View className="flex-row items-center gap-2">
        <FileText color="#09090b" fill="#09090b" size={18} />
        <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
          About
        </Text>
      </View>

      <Text className="font-medium font-sans text-foreground text-sm leading-relaxed">
        {profile.approach ??
          "A public profile for identifying the doctor before booking."}
      </Text>
    </Card>
  );
}
