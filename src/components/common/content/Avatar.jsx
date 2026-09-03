import React, { useState } from "react";
import { cn } from "../../../utils/cn";

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const statusSizeClasses = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-3.5 h-3.5",
};

const statusColorClasses = {
  online: "bg-emerald-500 ring-white",
  offline: "bg-gray-400 ring-white",
  busy: "bg-rose-500 ring-white",
  away: "bg-amber-500 ring-white",
};

const shapeClasses = {
  circle: "rounded-full",
  rounded: "rounded-xl",
  square: "rounded-none",
};

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  src,
  alt = "",
  name = "",
  size = "md",
  shape = "circle",
  status,
  className = "",
  ...props
}) {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name || alt);

  // Generate deterministic pastel background based on name
  const getBackgroundColor = (str) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-purple-100 text-purple-700",
      "bg-emerald-100 text-emerald-700",
      "bg-amber-100 text-amber-700",
      "bg-rose-100 text-rose-700",
      "bg-indigo-100 text-indigo-700",
      "bg-teal-100 text-teal-700",
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const showFallback = !src || imageError;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center font-semibold select-none",
        sizeClasses[size] || sizeClasses.md,
        shapeClasses[shape] || shapeClasses.circle,
        showFallback ? getBackgroundColor(name || alt || "default") : "bg-gray-100",
        className
      )}
      {...props}
    >
      {!showFallback ? (
        <img
          src={src}
          alt={alt || name || "Avatar"}
          onError={() => setImageError(true)}
          className={cn(
            "w-full h-full object-cover",
            shapeClasses[shape] || shapeClasses.circle
          )}
        />
      ) : (
        <span>{initials}</span>
      )}

      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2",
            statusSizeClasses[size] || statusSizeClasses.md,
            statusColorClasses[status] || statusColorClasses.online
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

export default Avatar;
