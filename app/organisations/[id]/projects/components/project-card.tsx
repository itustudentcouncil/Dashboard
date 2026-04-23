"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Project } from "@/lib/interfaces/projects/projects";

type ProjectCardProps = {
    project: Project;
    organisationId: string;
};

function formatDate(date: string | undefined): string {
    if (!date) {
        return "-";
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
        return "-";
    }

    return parsedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export default function ProjectCard({ project, organisationId }: ProjectCardProps) {
    return (
        <Card className="gap-0 overflow-hidden py-0 dark:bg-[rgba(40,23,25,0.9)] dark:border-[rgba(185,114,114,0.35)]">
            <div className="relative h-40 w-full bg-muted">
                {project.banner ? (
                    <Image
                        src={`https://cdn.studentcouncil.dk/${project.banner}`}
                        alt={project.title}
                        fill
                        sizes="(min-width: 1024px) 512px, 100vw"
                        className="object-cover"
                    />
                ) : null}
            </div>

            <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold leading-tight">{project.title}</h3>
                    <Button asChild size="sm" variant="outline" className="shrink-0">
                        <Link href={`/organisations/${organisationId}/projects/edit/${project.id}`}>Edit</Link>
                    </Button>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Start date: {formatDate(project.startDate)}</p>
                    {!project.isOngoing ? <p>End date: {formatDate(project.endDate)}</p> : null}
                </div>
            </div>
        </Card>
    );
}