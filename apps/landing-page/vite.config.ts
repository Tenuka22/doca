import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import alchemy from "alchemy/cloudflare/tanstack-start";
import { defineConfig, type PluginOption } from "vite";

const config = defineConfig(({ command }) => ({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    ...(command === "build" ? [alchemy() as PluginOption] : []),
    tanstackStart(),
    viteReact(),
  ],
}));

export default config;
