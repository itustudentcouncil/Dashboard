"use client";

import NewsMDX from "@/app/organisations/[id]/news/edit/components/news-mdx-preview";

type MdxEditorPanelProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function MdxEditorPanel({ value, onChange, disabled = false }: MdxEditorPanelProps) {
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-2">
      <div className="grid min-h-96 grid-rows-[auto_minmax(0,1fr)] gap-2">
        <label className="text-sm font-medium" htmlFor="news-content">
          Content
        </label>
        <textarea
          id="news-content"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Write your article in MDX format..."
          disabled={disabled}
          className="h-full min-h-0 w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm disabled:opacity-50"
        />
      </div>

      <div className="grid min-h-96 grid-rows-[auto_minmax(0,1fr)] gap-2">
        <p className="text-sm font-medium">Live Preview</p>
        <div className="h-full min-h-0 overflow-auto rounded-md border border-input bg-muted/30 p-4">
          {value.trim() ? (
            <NewsMDX content={value} />
          ) : (
            <p className="text-sm text-muted-foreground">Preview will appear here as you write.</p>
          )}
        </div>
      </div>
    </div>
  );
}
