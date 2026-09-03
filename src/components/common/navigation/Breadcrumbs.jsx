import React from "react";
import { cn } from "../../../utils/cn";

export function Breadcrumbs({
  items = [],
  separator = (
    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  ),
  maxItems,
  className = "",
  ...props
}) {
  let displayItems = items;

  // Truncate middle items if maxItems is defined and items exceed it
  if (maxItems && items.length > maxItems && maxItems >= 2) {
    const first = items.slice(0, 1);
    const last = items.slice(-(maxItems - 1));
    displayItems = [
      ...first,
      { label: "...", href: null, isEllipsis: true },
      ...last,
    ];
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)} {...props}>
      <ol className="flex items-center gap-2 list-none p-0 m-0 flex-wrap text-sm text-gray-500">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isCurrent = item.current || isLast;

          return (
            <li key={index} className="inline-flex items-center gap-2">
              {item.isEllipsis ? (
                <span className="text-gray-400 px-1 select-none">...</span>
              ) : isCurrent ? (
                <span
                  aria-current="page"
                  className="font-semibold text-gray-900 flex items-center gap-1.5"
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
              ) : (
                <a
                  href={item.href || "#"}
                  className="hover:text-blue-600 transition-colors flex items-center gap-1.5 hover:underline"
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </a>
              )}

              {!isLast && (
                <span aria-hidden="true" className="shrink-0">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
