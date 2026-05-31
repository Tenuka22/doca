import { Calendar, Sparkles, Stethoscope, User } from "lucide-react-native";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";

const tabs = [
  { href: "/doctors", icon: Stethoscope, label: "Doctors" },
  { href: "/appointments", icon: Calendar, label: "Appointments" },
  { href: "/sprite", icon: Sparkles, label: "Sprite" },
  { href: "/profile", icon: User, label: "Profile" },
] as const;

export const RootBottomBar = () => (
  <View className="-mx-page grid h-12 grid-cols-4 gap-0 border-border border-t-[3px] bg-card">
    {tabs.map(({ href, icon: Icon, label }) => (
      <Button
        className="h-full w-full rounded-none"
        href={href}
        key={href}
        variant="secondary"
      >
        <View className="flex-row items-center justify-center gap-2 py-4">
          <Icon color="#ffffff" size={18} />
          <Text className="font-bold font-sans text-white text-xs uppercase">
            {label}
          </Text>
        </View>
      </Button>
    ))}
  </View>
);
