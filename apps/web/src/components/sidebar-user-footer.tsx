"use client";

import { useSidebar } from "@suwa/ui/components/sidebar";
import { authClient } from "@/utils/auth";
import { Button } from "@suwa/ui/components/button";

export function SidebarUserFooter() {
  const { state } = useSidebar();
  const { data: session } = authClient.useSession();

  if (!session?.user) {
    return null;
  }

  const isCollapsed = state === "collapsed";
  const name = session.user.name ?? "User";
  const role = (session.user as any)?.role;
  const roleLabel =
    role === "admin" ? "Admin"
    : role === "tenant-admin" ? "Tenant Admin"
    : role === "doctor" ? "Doctor"
    : role === "pending-doctor" ? "Doctor (pending)"
    : "User";

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  return (
    <div className="flex items-center gap-3 rounded-md">
      <Button onClick={handleSignOut} size="sm" variant="ghost">
        Sign out
      </Button>
      {isCollapsed ? null : (
        <div className="min-w-0">
          <p className="truncate font-medium text-sm">{name}</p>
          <p className="truncate text-muted-foreground text-xs">
            {roleLabel}
          </p>
        </div>
      )}
    </div>
  );
}
