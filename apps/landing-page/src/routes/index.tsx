import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "./(home)/page";

export const Route = createFileRoute("/")({
  component: LandingPage,
});
