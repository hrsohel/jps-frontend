import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ── usePagination hook ──────────────────────────────────────────── */
export function usePagination(items, perPage = 10) {
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the source list changes
  useEffect(() => { setPage(1); }, [items.length]);

  const total      = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * perPage;
  const end        = Math.min(start + perPage, total);
  const paged      = items.slice(start, end);

  return { paged, page: safePage, setPage, totalPages, total, start, end };
}

/* ── Pagination UI component ─────────────────────────────────────── */
export default function Pagination({ page, totalPages, total, start, end, onPageChange, perPage }) {
  if (totalPages <= 1) return null;

  function pages() {
    const list = [];
    const delta = 2;
    const left  = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    list.push(1);
    if (left > 2) list.push("…");
    for (let i = left; i <= right; i++) list.push(i);
    if (right < totalPages - 1) list.push("…");
    if (totalPages > 1) list.push(totalPages);
    return list;
  }

  return (
    <div className="pagination-wrap">
      <span className="pagination-info">
        Showing <strong>{start + 1}–{end}</strong> of <strong>{total}</strong>
      </span>

      <div className="pagination-controls">
        <button
          className="pg-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous"
        >
          <ChevronLeft size={15} />
        </button>

        {pages().map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="pg-ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`pg-btn ${p === page ? "active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          className="pg-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
