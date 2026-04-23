import { Badge } from "@/components/ui/badge";

interface PermissionBadgeProps {
    permission: number;
}

export function PermissionBadge({ permission }: PermissionBadgeProps) {
    return (
        <Badge className={getPermissionBadgeStyle(permission)}>
            {getPermissionLabel(permission)}
        </Badge>
    );
}

function getPermissionLabel(permission: number): string {
    switch (permission) {
        case 1: return "Owner";
        case 2: return "Administrator";
        case 3: return "Member";
        default: return "Unknown";
    }
}

function getPermissionBadgeStyle(permission: number): string {
    switch (permission) {
        case 1:
            return "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
        case 2:
            return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
        case 3:
            return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
        default:
            return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
    }
}
