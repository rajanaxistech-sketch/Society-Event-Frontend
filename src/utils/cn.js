/**
 * Combines class names conditionally into a clean string.
 * Lightweight zero-dependency utility for Tailwind class management.
 * 
 * @param  {...any} classes - List of class strings, expressions, or objects
 * @returns {string} Combined class names
 */
export function cn(...classes) {
  return classes
    .flatMap((c) => {
      if (!c) return [];
      if (typeof c === "string") return c.split(" ");
      if (typeof c === "number") return `${c}`;
      if (Array.isArray(c)) return cn(...c).split(" ");
      if (typeof c === "object") {
        return Object.entries(c)
          .filter(([, val]) => Boolean(val))
          .map(([key]) => key);
      }
      return [];
    })
    .filter(Boolean)
    .join(" ")
    .trim();
}

export default cn;
