import { Avatar, Button, Chip } from "@heroui/react";
import { CopyIcon } from "lucide-react";
import { useState } from "react";

export function DoctorProfileHeader({
  doctorId,
  isVerified,
  name,
}: {
  doctorId: string;
  isVerified?: boolean;
  name: string;
}) {
  const [copiedDoctorId, setCopiedDoctorId] = useState(false);

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleCopyDoctorId = () => {
    navigator.clipboard.writeText(doctorId);
    setCopiedDoctorId(true);
    setTimeout(() => setCopiedDoctorId(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <Avatar className="rounded-full" size="lg">
        <Avatar.Image
          src={`https://api.dicebear.com/9.x/shapes/svg?seed=${name}`}
        />
        <Avatar.Fallback className="font-semibold text-2xl">
          {initials}
        </Avatar.Fallback>
      </Avatar>

      <div className="flex flex-1 flex-col">
        <div className="flex flex-row items-center gap-3">
          <h1 className="font-light text-2xl tracking-tight">{name}</h1>
          {isVerified ? (
            <Chip className="h-fit" size="sm" variant="primary">
              Verified professional
            </Chip>
          ) : (
            <Chip className="h-fit" size="sm" variant="secondary">
              Pending verification
            </Chip>
          )}
        </div>

        <p className="max-w-2xl font-light text-muted-foreground text-sm">
          Manage your public directory listing, therapeutic credentials, and
          introductory materials.
        </p>

        <div className="flex items-center gap-2 pt-4">
          <Chip size="lg">ID: {doctorId}</Chip>
          <Button
            onPress={handleCopyDoctorId}
            size="sm"
            variant={copiedDoctorId ? "primary" : "outline"}
          >
            <CopyIcon className="size-3" />
            {copiedDoctorId ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
    </div>
  );
}
