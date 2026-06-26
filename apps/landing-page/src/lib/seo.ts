export const SITE_NAME = "Suwa";

export const DEFAULT_SITE_URL = "https://app.suwa.life";

export const DEFAULT_DESCRIPTION =
  "Anonymous health consultations with licensed professionals and anonymity built in from the start.";

export type SeoRoute = Readonly<{
  path: `/${string}` | "/";
  changefreq: "weekly" | "monthly";
  priority: number;
}>;

export const SEO_ROUTES: readonly SeoRoute[] = [
  { path: "/", changefreq: "weekly", priority: 1 },
  { path: "/pricing", changefreq: "monthly", priority: 0.7 },
  { path: "/contact", changefreq: "monthly", priority: 0.6 },
] as const;

export function resolveSiteUrl(siteUrl?: string): string {
  return siteUrl?.trim() || DEFAULT_SITE_URL;
}

export function absoluteUrl(path: string, siteUrl?: string): string {
  return new URL(path, resolveSiteUrl(siteUrl)).toString();
}

export function createSeoHead({
  siteUrl,
  path,
  title,
  description,
}: Readonly<{
  siteUrl?: string;
  path: string;
  title: string;
  description: string;
}>) {
  const url = absoluteUrl(path, siteUrl);
  const image = absoluteUrl("/logo.png", siteUrl);

  return {
    links: [{ rel: "canonical", href: url }],
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "index,follow" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
  };
}
