"use client";

import type { Href, useRouter } from "expo-router";
import { Globe } from "lucide-react-native";

export const OAUTH_STRATEGIES = [
  { strategy: "oauth_google", label: "Google", icon: Globe },
] as const;

export function pushDecoratedUrl(
  router: ReturnType<typeof useRouter>,
  decorateUrl: (url: string) => string,
  href: string
) {
  const url = decorateUrl(href);
  const nextHref = url.startsWith("http") ? new URL(url).pathname : url;
  router.push(nextHref as Href);
}
