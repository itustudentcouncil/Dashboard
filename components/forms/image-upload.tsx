"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImageUploadProps = {
	id?: string;
	label: string;
	onFileChange: (file: File | null) => void;
	initialPreviewUrl?: string;
	previewShape?: "banner" | "icon";
	pickerTopSpacingClassName?: string;
};

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

function isValidImageFile(file: File): boolean {
	if (ALLOWED_MIME_TYPES.has(file.type)) return true;
	const extension = file.name.split(".").pop()?.toLowerCase();
	return extension ? ALLOWED_EXTENSIONS.has(extension) : false;
}

export function ImageUpload({
	id,
	label,
	onFileChange,
	initialPreviewUrl,
	previewShape = "banner",
	pickerTopSpacingClassName,
}: ImageUploadProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [selectedFileName, setSelectedFileName] = useState<string>("");
	const [error, setError] = useState<string>("");

	const hint = useMemo(() => "Allowed formats: .png, .jpg, .jpeg, .webp", []);
  const objectPreviewUrl = useMemo(
		() => (selectedFile ? URL.createObjectURL(selectedFile) : undefined),
		[selectedFile],
	);
	const previewUrl = objectPreviewUrl ?? initialPreviewUrl;
	const isIconPreview = previewShape === "icon";

	useEffect(() => {
		return () => {
			if (objectPreviewUrl) {
				URL.revokeObjectURL(objectPreviewUrl);
			}
		};
	}, [objectPreviewUrl]);

	const openPicker = () => {
		inputRef.current?.click();
	};

	return (
		<div className="space-y-2">
			<label className="text-sm font-medium" htmlFor={id}>{label}</label>
			<input
				ref={inputRef}
				id={id}
				type="file"
				className="hidden"
				accept=".png,.jpeg,.jpg,.webp"
				onChange={(e) => {
					const file = e.target.files?.[0] ?? null;
					if (!file) {
						// Keep the previous selection when the picker is dismissed.
						return;
					}

					if (!isValidImageFile(file)) {
						if (e.currentTarget) {
							e.currentTarget.value = "";
						}
						setError("Invalid file type. Please select a .png, .jpg, .jpeg, or .webp image.");
						return;
					}

					setSelectedFile(file);
					setSelectedFileName(file.name);
					setError("");
					onFileChange(file);
				}}
			/>
			<div
				role="button"
				tabIndex={0}
				className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-4 py-5 text-center hover:bg-muted/60 ${pickerTopSpacingClassName ?? ""}`}
				onClick={openPicker}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						openPicker();
					}
				}}
			>
				<Upload className="size-5 text-muted-foreground" />
				<p className="text-sm font-medium">Click to choose an image</p>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={(e) => {
						e.stopPropagation();
						openPicker();
					}}
				>
					Select image
				</Button>
			</div>
			<div className={isIconPreview
				? "flex h-28 items-center justify-center rounded-md border border-border bg-muted"
				: "relative h-28 overflow-hidden rounded-md border border-border bg-muted"}
			>
				{previewUrl ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={previewUrl}
						alt={`${label} preview`}
						className={isIconPreview ? "h-20 w-20 rounded-full object-cover" : "h-full w-full object-cover"}
					/>
				) : null}
			</div>
			<p className="text-xs text-muted-foreground">{hint}</p>
			{selectedFileName ? <p className="text-xs text-muted-foreground">Selected: {selectedFileName}</p> : null}
			{error ? <p className="text-xs text-destructive">{error}</p> : null}
		</div>
	);
}

