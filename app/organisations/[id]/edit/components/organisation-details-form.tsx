"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/lib/interfaces/organisations/category";

type OrganisationDetailsFormCardProps = {
  name: string;
  description: string;
  selectedCategoryId: string;
  categories: Category[];
  isSaving: boolean;
  isNameValid: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSaveDetails: () => void;
  status?: {
    type: "success" | "error";
    message: string;
  } | null;
};

export function OrganisationDetailsFormCard({
  name,
  description,
  selectedCategoryId,
  categories,
  isSaving,
  isNameValid,
  onNameChange,
  onDescriptionChange,
  onCategoryChange,
  onSaveDetails,
  status,
}: OrganisationDetailsFormCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisation Details</CardTitle>
        <CardDescription>Basic profile information shown to users.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="org-name">Name</label>
            <Input id="org-name" value={name} onChange={(e) => onNameChange(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={selectedCategoryId} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent position="popper" align="start" className="max-h-80 overflow-hidden">
                <SelectGroup className="max-h-72 overflow-y-auto">
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="org-description">Description</label>
          <textarea
            id="org-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={onSaveDetails} disabled={isSaving || !isNameValid}>
            {isSaving ? "Saving..." : "Save Details"}
          </Button>
        </div>

        {status ? (
          <p className={`text-sm ${status.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {status.message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
