import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "./(home)/page";
import {
  DEFAULT_DESCRIPTION,
  createSeoHead,
  resolveSiteUrl,
} from "../lib/seo";

const siteUrl = resolveSiteUrl(import.meta.env.VITE_WEB_URL);

export const Route = createFileRoute("/")({
  head: () =>
    createSeoHead({
      siteUrl,
      path: "/",
      title: "Suwa - Anonymous health consultations, on your terms.",
      description: DEFAULT_DESCRIPTION,
    }),
  component: LandingPage,
});
