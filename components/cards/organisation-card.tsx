import Image from "next/image";
import Link from "next/link";
import * as motion from "motion/react-client";
import { AccountOrganisation } from "@/lib/interfaces/accounts/account-organisation";
import { PermissionBadge } from "./permission-badge";

interface OrganisationCardProps {
    organisation: AccountOrganisation;
}

export function OrganisationCard({ organisation }: OrganisationCardProps) {
    return (
        <Link href={`/organisations/${organisation.slug}`} scroll>
            <motion.div
                className="group flex items-center gap-4 rounded-xl border border-[rgba(185,114,114,0.25)] bg-[rgba(40,23,25,0.9)] px-5 py-4 hover:border-[rgba(185,114,114,0.5)]"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
            >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[rgba(185,114,114,0.3)]">
                    <Image
                        src={"https://cdn.studentcouncil.dk/" + organisation.icon}
                        alt={`${organisation.name} icon`}
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-base font-semibold group-hover:underline">
                        {organisation.name}
                    </span>
                    <PermissionBadge permission={organisation.permissionLevel} />
                </div>
            </motion.div>
        </Link>
    );
}