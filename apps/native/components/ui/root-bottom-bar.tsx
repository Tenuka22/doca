import {
  Activity,
  Calendar,
  HeartHandshake,
  HeartPulse,
  Shield,
  Sparkles,
  Stethoscope,
  User,
} from "lucide-react-native";
import { Text, useWindowDimensions, View } from "react-native";

import { Button } from "@/components/ui/button";
import { useUserMode } from "@/utils/user-mode";

const SMALL_BREAKPOINT = 400;

const patientTabs = [
  { href: "/doctors", icon: Stethoscope, label: "Doctors" },
  { href: "/appointments", icon: Calendar, label: "Appointments" },
  { href: "/sprite", icon: Sparkles, label: "Sprite" },
  { href: "/stress-hub", icon: Activity, label: "Stress Hub" },
  { href: "/profile", icon: User, label: "Profile" },
] as const;

const guardianTabs = [
  { href: "/dashboard", icon: HeartHandshake, label: "Dashboard" },
  { href: "/patient-stress", icon: Activity, label: "Stress" },
  { href: "/patient-activity", icon: HeartPulse, label: "Activity" },
  { href: "/patient-profile", icon: User, label: "Patient" },
  { href: "/guardian-profile", icon: Shield, label: "Profile" },
] as const;

export const RootBottomBar = () => {
  const { mode } = useUserMode();
  const { width } = useWindowDimensions();
  const isSmall = width < SMALL_BREAKPOINT;

  const tabs = mode === "guardian" ? guardianTabs : patientTabs;

  return (
    <View className="-mx-page grid h-12 grid-cols-5 gap-0 border-border border-t-[3px] bg-card">
      {tabs.map(({ href, icon: Icon, label }) => (
        <Button
          className="h-full w-full rounded-none"
          href={href}
          key={href}
          variant="secondary"
        >
          <View className="flex-row items-center justify-center gap-1.5 py-4">
            <Icon color="#ffffff" size={18} />
            {!isSmall && (
              <Text className="font-bold font-sans text-white text-[10px] uppercase">
                {label}
              </Text>
            )}
          </View>
        </Button>
      ))}
    </View>
  );
};
