"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type LeaveOrganisationButtonProps = {
  organisationPathId: string;
  organisationName: string;
  currentMemberAccountId: string;
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

export function LeaveOrganisationButton({ organisationPathId, organisationName, currentMemberAccountId }: LeaveOrganisationButtonProps) {
  const router = useRouter();

  const handleLeave = async () => {
    const confirmed = window.confirm(`Leave ${organisationName}?`);
    if (!confirmed) {
      return;
    }

    const leavePromise = async () => {
      const response = await fetch(`/api/organisations/${organisationPathId}/members/${currentMemberAccountId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, "Failed to leave organisation.");
        throw new Error(message);
      }
    };

    await toast.promise(leavePromise(), {
      loading: "Leaving organisation...",
      success: () => {
        router.push("/");
        router.refresh();
        return "You left the organisation.";
      },
      error: (error) => error.message || "Failed to leave organisation.",
    });
  };

  return (
    <Button type="button" variant="outline" onClick={() => void handleLeave()}>
      Leave organisation
    </Button>
  );
}