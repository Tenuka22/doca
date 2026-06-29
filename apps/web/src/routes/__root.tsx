import { APP_DISPLAY_NAME, LOGO_PATH } from "@suwa/app-info";
import { Toaster } from "@suwa/ui/components/sonner";
import { TooltipProvider } from "@suwa/ui/components/tooltip";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { orpc } from "@/utils/orpc";
import appCss from "../index.css?url";

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: LOGO_PATH,
      },
    ],
    title: APP_DISPLAY_NAME,
  }),

  component: RootDocument,
});

function RootDocument() {
  const showDevtools =
    import.meta.env.DEV && import.meta.env.VITE_SHOW_DEVTOOLS === "true";

  return (
    <TooltipProvider>
      <html className="light" lang="en">
        <head>
          <HeadContent />
        </head>
        <body>
          <Outlet />
          <Toaster richColors />
          {showDevtools ? (
            <>
              <TanStackRouterDevtools position="bottom-left" />
              <ReactQueryDevtools
                buttonPosition="bottom-right"
                position="bottom"
              />
            </>
          ) : null}
          <Scripts />
        </body>
      </html>
    </TooltipProvider>
  );
}
