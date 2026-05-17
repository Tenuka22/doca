"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@zen-doc/ui/components/sidebar";
import { HouseIcon, LayoutDashboardIcon } from "lucide-react";

import { SidebarNavSection } from "@/components/sidebar-nav-section";
import { SidebarUserFooter } from "@/components/sidebar-user-footer";

export function DoctorSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex flex-col gap-1 px-2 py-1">
          <span className="font-semibold text-sm">Doctor Portal</span>
          <span className="text-muted-foreground text-xs">ZenDoc</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNavSection
          items={[{ icon: HouseIcon, label: "Home", to: "/" }]}
          label="Main"
        />
        <SidebarNavSection
          items={[
            { icon: LayoutDashboardIcon, label: "Dashboard", to: "/doctor" },
          ]}
          label="Secondary"
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUserFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
