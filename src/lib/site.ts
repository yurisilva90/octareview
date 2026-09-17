export const siteBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteBasePath}${normalized}`;
}
