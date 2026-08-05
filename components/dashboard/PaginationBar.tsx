"use client";

import { ToolbarButton } from "@/components/dashboard/dashboard-ui";
import type { PageSlice } from "@/lib/pagination";

export function PaginationBar<T>({
  slice,
  onPageChange,
  label = "rows",
}: {
  slice: PageSlice<T>;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  if (slice.total === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-mahogany/[0.05] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="font-sans text-xs text-mahogany/50" aria-live="polite">
        Showing {slice.from}–{slice.to} of {slice.total} {label}
      </p>
      <div className="flex items-center gap-2">
        <ToolbarButton disabled={slice.page <= 1} onClick={() => onPageChange(slice.page - 1)}>
          Previous
        </ToolbarButton>
        <span className="font-sans text-xs font-semibold text-mahogany/60">
          Page {slice.page} / {slice.totalPages}
        </span>
        <ToolbarButton
          disabled={slice.page >= slice.totalPages}
          onClick={() => onPageChange(slice.page + 1)}
        >
          Next
        </ToolbarButton>
      </div>
    </div>
  );
}
