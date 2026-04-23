"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { MdxEditorPanel } from "@/app/organisations/[id]/news/edit/components/mdx-editor-panel";
import { ImageUpload } from "@/components/forms/image-upload";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";

const TITLE_MAX_LENGTH = 180;

type ProjectFormProps = {
	organisationId: string;
	organisationPathId: string;
	mode?: "create" | "edit";
	projectId?: string;
	initialValues?: {
		title: string;
		content: string;
		startDate: string;
		endDate?: string;
		isOngoing: boolean;
		bannerPath?: string;
	};
};

function toDateInputValue(value: string | undefined): string {
	if (!value) {
		return "";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "";
	}

	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function toRfc3339DateTime(value: string): string {
	const [yearRaw, monthRaw, dayRaw] = value.split("-");
	const year = Number(yearRaw);
	const month = Number(monthRaw);
	const day = Number(dayRaw);

	if (!year || !month || !day) {
		throw new Error("Invalid date value.");
	}

	return new Date(Date.UTC(year, month - 1, day, 0, 0, 0)).toISOString();
}

async function getErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
	const contentType = response.headers.get("content-type") ?? "";

	if (contentType.includes("application/json")) {
		try {
			const data = (await response.json()) as { message?: string };
			return data?.message || fallbackMessage;
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

export function ProjectForm({
	organisationId,
	organisationPathId,
	mode = "create",
	projectId,
	initialValues,
}: ProjectFormProps) {
	const router = useRouter();
	const [title, setTitle] = useState(initialValues?.title ?? "");
	const [content, setContent] = useState(initialValues?.content ?? "");
	const [startDate, setStartDate] = useState(toDateInputValue(initialValues?.startDate));
	const [endDate, setEndDate] = useState(toDateInputValue(initialValues?.endDate));
	const [isOngoing, setIsOngoing] = useState(initialValues?.isOngoing ?? false);
	const [bannerFile, setBannerFile] = useState<File | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const initialBannerPreviewUrl = useMemo(() => {
		if (!initialValues?.bannerPath) {
			return undefined;
		}

		return `https://cdn.studentcouncil.dk/${initialValues.bannerPath}`;
	}, [initialValues?.bannerPath]);

	const submit = async () => {
		if (!title.trim()) {
			toast.warning("Please enter a project title.");
			return;
		}

		if (title.trim().length > TITLE_MAX_LENGTH) {
			toast.error(`Title cannot exceed ${TITLE_MAX_LENGTH} characters.`);
			return;
		}

		if (!startDate) {
			toast.warning("Please pick a start date.");
			return;
		}

		if (!isOngoing && !endDate) {
			toast.warning("Please pick an end date or mark the project as ongoing.");
			return;
		}

		if (!isOngoing && endDate && startDate > endDate) {
			toast.error("Start date cannot be after end date.");
			return;
		}

		if (!content.trim()) {
			toast.warning("Please provide project content.");
			return;
		}

		if (mode === "edit" && !projectId) {
			toast.error("Missing project ID for update.");
			return;
		}

		let startDateRfc3339 = "";
		let endDateRfc3339 = "";
		try {
			startDateRfc3339 = toRfc3339DateTime(startDate);
			if (!isOngoing && endDate) {
				endDateRfc3339 = toRfc3339DateTime(endDate);
			}
		} catch {
			toast.error("Please provide valid dates.");
			return;
		}

		const formData = new FormData();
		const endpoint = mode === "edit"
			? `/api/projects/${projectId}`
			: `/api/projects?organisationId=${encodeURIComponent(organisationId)}`;
		const method = mode === "edit" ? "PATCH" : "POST";
		const finalIsOngoing = !endDateRfc3339;
		formData.set("Title", title.trim());
		formData.set("Content", new File([content], "project.mdx", { type: "text/markdown" }));
		formData.set("StartDate", startDateRfc3339);
		formData.set("IsOngoing", String(finalIsOngoing));
		if (endDateRfc3339) {
			formData.set("EndDate", endDateRfc3339);
		}
		if (bannerFile) {
			formData.set("Banner", bannerFile);
		}

		try {
			setIsSubmitting(true);
			const response = await fetch(endpoint, {
				method,
				body: formData,
			});

			if (!response.ok) {
				const message = await getErrorMessage(
					response,
					mode === "edit" ? "Failed to update project." : "Failed to create project.",
				);
				throw new Error(message);
			}

			toast.success(mode === "edit" ? "Project updated." : "Project created.");
			router.push(`/organisations/${organisationPathId}/projects`);
			router.refresh();
			if (mode !== "edit") {
				setTitle("");
				setContent("");
				setStartDate("");
				setEndDate("");
				setIsOngoing(false);
				setBannerFile(null);
			}
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: mode === "edit"
						? "Failed to update project."
						: "Failed to create project.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const removeProject = async () => {
		if (mode !== "edit" || !projectId) {
			return;
		}

		if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) {
			return;
		}

		try {
			setIsDeleting(true);
			const response = await fetch(`/api/projects/${projectId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const message = await getErrorMessage(response, "Failed to delete project.");
				throw new Error(message);
			}

			toast.success("Project deleted.");
			router.push(`/organisations/${organisationPathId}/projects`);
			router.refresh();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to delete project.");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<form
			className="space-y-5"
			onSubmit={(event) => {
				event.preventDefault();
				void submit();
			}}
		>
			<div className="space-y-2">
				<label className="text-sm font-medium" htmlFor="project-title">Title</label>
				<Input
					id="project-title"
					value={title}
					onChange={(event) => setTitle(event.target.value)}
					maxLength={TITLE_MAX_LENGTH}
					disabled={isSubmitting}
					placeholder="Project title"
				/>
				<p className="text-right text-xs text-muted-foreground">{title.length}/{TITLE_MAX_LENGTH}</p>
			</div>

			<div className="grid w-full items-stretch gap-4 lg:grid-cols-2">
				<div className="flex min-h-0 flex-col gap-3">
					<div className="space-y-4">
						<label className="text-sm font-medium" htmlFor="project-start-date">Start Date</label>
						<DatePicker
							id="project-start-date"
							value={startDate}
							onChange={setStartDate}
							disabled={isSubmitting}
							placeholder="Pick start date"
						/>
					</div>

					<div className="space-y-4">
						<label className="text-sm font-medium" htmlFor="project-end-date">End Date</label>
						<DatePicker
							id="project-end-date"
							value={endDate}
							onChange={setEndDate}
							disabled={isSubmitting || isOngoing}
							placeholder="Pick end date"
						/>
					</div>

					<label className="flex cursor-pointer items-center gap-2 mt-2 ml-1 text-sm font-medium">
						<Checkbox
							checked={isOngoing}
							onCheckedChange={(checked) => {
								const nextValue = checked === true;
								setIsOngoing(nextValue);
								if (nextValue) {
									setEndDate("");
								}
							}}
							disabled={isSubmitting}
						/>
						Ongoing project
					</label>
				</div>

				<div className="h-full min-h-0">
					<ImageUpload
						id="project-banner"
						label="Banner Image"
						onFileChange={setBannerFile}
						initialPreviewUrl={initialBannerPreviewUrl}
						previewShape="banner"
						pickerTopSpacingClassName="mt-2"
					/>
				</div>
			</div>

			<MdxEditorPanel value={content} onChange={setContent} disabled={isSubmitting} />

			<div className="flex items-center justify-between gap-3">
				{mode === "edit" ? (
					<Button
						type="button"
						variant="destructive"
						onClick={() => void removeProject()}
						disabled={isSubmitting || isDeleting}
					>
						{isDeleting ? "Deleting..." : "Delete Project"}
					</Button>
				) : <div />}

				<Button type="submit" disabled={isSubmitting || isDeleting}>
					{isSubmitting ? (mode === "edit" ? "Updating..." : "Creating...") : mode === "edit" ? "Update Project" : "Create Project"}
				</Button>
			</div>
		</form>
	);
}
