import { useUser } from "@clerk/tanstack-react-start";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@zen-doc/ui/components/avatar";
import { Badge } from "@zen-doc/ui/components/badge";
import { Card, CardContent, CardHeader } from "@zen-doc/ui/components/card";
import { Separator } from "@zen-doc/ui/components/separator";
import {
	BadgeCheckIcon,
	BookOpenIcon,
	FileIcon,
	GlobeIcon,
	LanguagesIcon,
	UserCircleIcon,
	VideoIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { MetricCard, SectionHeader } from "@/components/dashboard-metrics";
import { DoctorFilesPanel, DoctorProfileCard } from "@/components/doctors";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/profile")({
	loaderDeps: () => ({}),
	loader: async ({ context }) => {
		const [stats, profileData] = await Promise.all([
			context.queryClient.ensureQueryData(orpc.profileStats.queryOptions()),
			context.queryClient.ensureQueryData(orpc.doctorProfile.queryOptions()),
		]);
		return { stats, profileData };
	},
	component: DoctorProfileRoute,
});

const FILE_KIND_COLORS: Record<string, string> = {
  portrait: "#4A90D9",
  qualification: "#50C878",
  intro_video: "#FF6B6B",
  other: "#9B59B6",
};

async function seedDevProfile(_userId: string) {
  await orpc.saveDoctorProfile.call({
    displayName: "Dr. Sarah Chen",
    headline:
      "Licensed Clinical Psychologist specializing in anxiety and trauma recovery",
    bio: "With over 12 years of clinical experience, I specialize in evidence-based treatments for anxiety disorders, trauma recovery, and stress management. My approach integrates cognitive-behavioral therapy with mindfulness practices to help patients achieve lasting well-being.",
    licenseNumber: "PSY-2024-12345",
    location: "San Francisco, CA",
    experienceStartYear: 2012,
    specialties: ["psychology", "counseling"],
    languages: ["english", "spanish", "french"],
    consultationModes: ["video", "in_person"],
    focusAreas: [
      "anxiety",
      "depression",
      "stress",
      "trauma",
      "burnout",
      "sleep",
    ],
    approach:
      "I use a combination of CBT, DBT, and mindfulness-based approaches tailored to each patient's unique needs and circumstances.",
    education:
      "Ph.D. in Clinical Psychology - Stanford University\nM.A. in Counseling Psychology - UC Berkeley",
    placeName: "Mindful Growth Therapy Center",
    placeAddress: "456 Wellness Avenue, Suite 200, San Francisco, CA 94102",
    placeDescription:
      "A warm, welcoming therapeutic space designed for comfort, privacy, and healing.",
    approachSteps: [
      {
        id: crypto.randomUUID(),
        text: "Initial consultation and comprehensive assessment",
      },
      {
        id: crypto.randomUUID(),
        text: "Collaborative goal setting and personalized treatment planning",
      },
      {
        id: crypto.randomUUID(),
        text: "Evidence-based therapy sessions with progress tracking",
      },
      {
        id: crypto.randomUUID(),
        text: "Regular progress evaluation and plan adjustment",
      },
    ],
    educationEntries: [
      {
        id: crypto.randomUUID(),
        institution: "Stanford University",
        degree: "Ph.D. in Clinical Psychology",
        year: 2012,
      },
      {
        id: crypto.randomUUID(),
        institution: "UC Berkeley",
        degree: "M.A. in Counseling Psychology",
        year: 2008,
      },
      {
        id: crypto.randomUUID(),
        institution: "UCLA",
        degree: "B.A. in Psychology",
        year: 2005,
      },
    ],
  });
}

function createFakeImageFile(name: string, kind: string): File {
  const color = FILE_KIND_COLORS[kind] ?? "#CCCCCC";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="${color}"/><text x="50%" y="45%" fill="white" font-size="18" text-anchor="middle" font-family="sans-serif">${name}</text><text x="50%" y="65%" fill="rgba(255,255,255,0.7)" font-size="12" text-anchor="middle" font-family="sans-serif">${kind}</text></svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml" });
  return new File([blob], `${name}.svg`, {
    type: "image/svg+xml",
  });
}

async function seedDevFiles(userId: string) {
  const fakeFiles = [
    {
      kind: "portrait" as const,
      caption: "Professional headshot",
      name: "Professional Portrait",
    },
    {
      kind: "qualification" as const,
      caption: "Clinical Psychology License",
      name: "License Certificate",
    },
    {
      kind: "intro_video" as const,
      caption: "Introduction video thumbnail",
      name: "Intro Video",
    },
  ];

  for (const f of fakeFiles) {
    try {
      await orpc.createDoctorFile.call({
        caption: f.caption,
        doctorId: userId,
        file: createFakeImageFile(f.name, f.kind),
        fileKind: f.kind,
      });
    } catch {
      // File upload failed silently in dev mode
    }
  }
}

function DoctorProfileRoute() {
	const user = useUser();
	const { stats, profileData } = Route.useLoaderData();
	const canManageFiles = profileData?.profile?.permanent ?? false;

	const [devAutoFillDone, setDevAutoFillDone] = useState(false);
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!import.meta.env.DEV) {
			return;
		}
		if (!user.user) {
			return;
		}
		if (devAutoFillDone) {
			return;
		}

		if (profileData?.profile || (stats?.fileCount ?? 0) > 0) {
			setDevAutoFillDone(true);
			return;
		}

		setDevAutoFillDone(true);

		(async () => {
			try {
				if (!profileData?.profile) {
					await seedDevProfile(user.user.id);
				}

				if ((stats?.fileCount ?? 0) === 0) {
					await seedDevFiles(user.user.id);
				}
				queryClient.invalidateQueries();
			} catch {
				// Dev auto-fill failed silently
			}
		})();
	}, [
		user.isLoaded,
		user.user,
		profileData,
		stats,
		devAutoFillDone,
		queryClient,
	]);

	const name = user.user?.fullName ?? user.user?.username ?? "Doctor";
	const initials = name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const completenessPercentage = stats?.completenessPercentage ?? 0;
	const fileCount = stats?.fileCount ?? 0;
	const specialtyCount = stats?.specialtyCount ?? 0;
	const languageCount = stats?.languageCount ?? 0;
	const isPermanent = stats?.isPermanent ?? false;
	const profileExists = stats?.profileExists ?? false;

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="size-16 border shadow-sm">
                <AvatarFallback className="font-semibold text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Doctor profile</Badge>
                  {isPermanent ? (
                    <Badge variant="default">
                      <BadgeCheckIcon className="mr-1 size-3.5" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pending verification</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <h1 className="font-semibold text-4xl tracking-tight">
                    {name}
                  </h1>

                  <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
                    Manage your public directory listing, therapeutic
                    credentials, and introductory materials. A complete profile
                    helps patients find and trust you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description={`${profileExists ? "In progress" : "Not started yet"}`}
          icon={<UserCircleIcon className="size-5" />}
          title="Profile completeness"
          trend={profileExists ? `${completenessPercentage}%` : undefined}
          value={`${completenessPercentage}%`}
        />

        <MetricCard
          description="Uploaded introductory materials"
          icon={<FileIcon className="size-5" />}
          title="Files"
          value={fileCount.toString()}
        />

        <MetricCard
          description="Areas of therapeutic expertise"
          icon={<BookOpenIcon className="size-5" />}
          title="Specialties"
          value={specialtyCount.toString()}
        />

        <MetricCard
          description="Languages you speak with patients"
          icon={<LanguagesIcon className="size-5" />}
          title="Languages"
          value={languageCount.toString()}
        />
      </section>

      <div className="grid gap-6">
        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <SectionHeader
              action={
                <Badge className="gap-1" variant="secondary">
                  <GlobeIcon className="size-3" />
                  Public listing
                </Badge>
              }
              description="Your professional details visible to patients"
              title="Profile information"
            />
          </CardHeader>

          <Separator />

          <CardContent>
            <DoctorProfileCard />
          </CardContent>
        </Card>
      </div>

      {user.user ? (
        <div className="grid gap-6">
          <Card className="rounded-3xl border-border/60">
            <CardHeader>
              <SectionHeader
                action={
                  <Badge className="gap-1" variant="secondary">
                    <VideoIcon className="size-3" />
                    Media & files
                  </Badge>
                }
                description="Upload and manage your introductory photos, videos, and qualifications"
                title="Introductory materials"
              />
            </CardHeader>

            <Separator />

            <CardContent>
              <DoctorFilesPanel
                canManage={canManageFiles}
                doctorId={user.user.id}
                isPermanent={profileData?.profile?.permanent ?? false}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
