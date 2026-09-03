import React from "react";
import { cn } from "../../../utils/cn";

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  siblingCount = 1,
  showEdges = true,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  className = "",
  ...props
}) {
  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const totalNumbers = siblingCount * 2 + 3; // siblings + current + first + last
    const totalBlocks = totalNumbers + 2; // + 2 ellipses

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "...", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [firstPageIndex, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
    }

    return [];
  };

  const pages = getPageNumbers();

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange?.(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange?.(currentPage + 1);
    }
  };

  return (
    <div
      aria-label="Pagination"
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 py-3 text-sm text-gray-700",
        className
      )}
      {...props}
    >
      {/* Optional Page Size & Total counter */}
      {(totalItems !== undefined || (pageSize && onPageSizeChange)) && (
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {totalItems !== undefined && (
            <span>
              Showing{" "}
              <span className="font-semibold text-gray-800">
                {Math.min((currentPage - 1) * (pageSize || 10) + 1, totalItems)}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-800">
                {Math.min(currentPage * (pageSize || 10), totalItems)}
              </span>{" "}
              of <span className="font-semibold text-gray-800">{totalItems}</span> results
            </span>
          )}

          {pageSize && onPageSizeChange && (
            <div className="flex items-center gap-1.5 ml-2">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                className="px-2 py-1 bg-white border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
              >
                {pageSizeOptions.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <nav className="flex items-center gap-1 ml-auto">
        {/* First Page */}
        {showEdges && (
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange?.(1)}
            aria-label="First page"
            className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Previous Page */}
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={handlePrev}
          aria-label="Previous page"
          className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page Number Buttons */}
        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span key={`dots-${idx}`} className="px-2 py-1 text-gray-400 select-none">
                ...
              </span>
            );
          }

          const isCurrent = p === currentPage;

          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange?.(p)}
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                "min-w-[32px] h-8 px-2 text-xs font-medium rounded-lg transition-colors duration-150",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                isCurrent
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {p}
            </button>
          );
        })}

        {/* Next Page */}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={handleNext}
          aria-label="Next page"
          className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Last Page */}
        {showEdges && (
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange?.(totalPages)}
            aria-label="Last page"
            className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </nav>
    </div>
  );
}

export default Pagination;
