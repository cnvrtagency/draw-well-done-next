export const showDevTools =
  (typeof process !== "undefined" && process.env.NODE_ENV !== "production") ||
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === "true") ||
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEV_TOOLS === "true");
