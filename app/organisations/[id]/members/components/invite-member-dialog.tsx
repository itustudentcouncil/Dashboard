"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InviteMemberDialogProps = {
  organisationPathId: string;
  currentPermissionLevel: number | null;
  isGlobalAdministrator?: boolean;
};

async function getErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const data = (await response.json()) as { message?: string };
      if (data?.message) {
        return data.message;
      }
    } catch {
      return fallbackMessage;
    }
  }

  try {
    const text = await response.text();
    return text || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

function isItuEmail(value: string): boolean {
  return /^[^\s@]+@itu\.dk$/i.test(value.trim());
}

export function InviteMemberDialog({ organisationPathId, currentPermissionLevel, isGlobalAdministrator }: InviteMemberDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [permissionLevel, setPermissionLevel] = useState("3");
  const [visibility, setVisibility] = useState("private");

  const canInvite = currentPermissionLevel !== null && currentPermissionLevel <= 2;
  const isOwner = currentPermissionLevel === 1;
  const isAdmin = currentPermissionLevel === 2;
  const canSelectPermissionLevel = isOwner || isGlobalAdministrator;
  
  const permissionOptions = useMemo(() => {
    if (canSelectPermissionLevel) {
      return [
        { value: "1", label: "Owner" },
        { value: "2", label: "Administrator" },
        { value: "3", label: "Member" },
      ];
    }
    return [
      { value: "3", label: "Member" },
    ];
  }, [canSelectPermissionLevel]);

  const handleSendInvite = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!isItuEmail(trimmedEmail)) {
      toast.error("Invitation email must use an @itu.dk address.");
      return;
    }

    const selectedPermission = Number(permissionLevel);
    const isPublic = visibility === "public";

    const sendInvitePromise = async () => {
      const response = await fetch(`/api/organisations/${organisationPathId}/members/invite`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          permissionLevel: selectedPermission,
          isPublic,
        }),
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, "Failed to send invite.");
        throw new Error(message);
      }

      return "Invite has been sent successfully.";
    };

    await toast.promise(sendInvitePromise(), {
      loading: "Sending invite...",
      success: (message) => {
        setOpen(false);
        setEmail("");
        setPermissionLevel("3");
        setVisibility("private");
        router.refresh();
        return message;
      },
      error: (error) => error.message || "Failed to send invite.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" disabled={!canInvite}>
          Invite member
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Send an invitation email to an ITU address and set initial permission and visibility.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="invite-email">
              Email
            </label>
            <Input
              id="invite-email"
              type="email"
              placeholder="name@itu.dk"
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Only @itu.dk email addresses are allowed.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Permission</label>
              <Select value={permissionLevel} onValueChange={setPermissionLevel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select permission" />
                </SelectTrigger>
                <SelectContent>
                  {permissionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Visibility</label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => void handleSendInvite()}>
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}