import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
    ],
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Suwa — Private health consultations, on your terms." },
      {
        name: "description",
        content:
          "Private health consultations with licensed professionals and anonymity built in from the start.",
      },
      { name: "theme-color", content: "#faf8f2" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
