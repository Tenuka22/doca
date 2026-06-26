import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_SITE_URL,
  SEO_ROUTES,
  absoluteUrl,
  resolveSiteUrl,
} from "../src/lib/seo";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const publicDir = join(rootDir, "public");

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildSitemapXml(siteUrl: string): string {
  const urls = SEO_ROUTES.map(
    ({ path, changefreq, priority }) => `  <url>\n    <loc>${escapeXml(
      absoluteUrl(path, siteUrl)
    )}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority.toFixed(1)}</priority>\n  </url>`
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildRobotsTxt(siteUrl: string): string {
  return [
    "# https://www.robotstxt.org/robotstxt.html",
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml", siteUrl)}`,
    "",
  ].join("\n");
}

async function main() {
  const siteUrl = resolveSiteUrl(process.env.SITE_URL ?? DEFAULT_SITE_URL);

  await mkdir(publicDir, { recursive: true });
  await writeFile(join(publicDir, "sitemap.xml"), buildSitemapXml(siteUrl));
  await writeFile(join(publicDir, "robots.txt"), buildRobotsTxt(siteUrl));

  console.log(`Generated sitemap and robots for ${siteUrl}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
