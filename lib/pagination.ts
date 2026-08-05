/** Client-side list pagination for dashboard tables. */

export const DEFAULT_PAGE_SIZE = 25;

export type PageSlice<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  from: number;
  to: number;
};

export function paginateItems<T>(
  items: readonly T[],
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
): PageSlice<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return {
    items: slice as T[],
    page: safePage,
    pageSize,
    total,
    totalPages,
    from: total === 0 ? 0 : start + 1,
    to: start + slice.length,
  };
}
