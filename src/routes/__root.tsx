import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="pixel-card max-w-md p-8 text-center">
        <h1 className="pixel-heading text-5xl text-oranje">404</h1>
        <h2 className="pixel-heading mt-4 text-sm text-foreground">Game over</h2>
        <p className="mt-3 text-muted-foreground">
          Deze pagina bestaat niet of is verplaatst.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="pixel-btn inline-flex items-center justify-center bg-oranje px-4 py-2 text-primary-foreground hover:bg-oranje-dark"
          >
            Insert coin — naar home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="pixel-card max-w-md p-8 text-center">
        <h1 className="pixel-heading text-sm text-oranje">Deze pagina laadde niet</h1>
        <p className="mt-3 text-muted-foreground">
          Er ging iets mis aan onze kant. Probeer het opnieuw of ga terug naar home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="pixel-btn inline-flex items-center justify-center bg-oranje px-4 py-2 text-primary-foreground hover:bg-oranje-dark"
          >
            Continue?
          </button>
          <a
            href="/"
            className="pixel-btn inline-flex items-center justify-center bg-secondary px-4 py-2 text-foreground hover:bg-accent"
          >
            Naar home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DutchMSP WK 2026 Poule" },
      { name: "description", content: "Voorspel de uitslagen van Nederland op het WK 2026. Doe mee met de DutchMSP poule!" },
      { name: "author", content: "DutchMSP" },
      { property: "og:title", content: "DutchMSP WK 2026 Poule" },
      { property: "og:description", content: "Voorspel de uitslagen van Nederland op het WK 2026. Doe mee met de DutchMSP poule!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@DutchMSP" },
      { name: "twitter:title", content: "DutchMSP WK 2026 Poule" },
      { name: "twitter:description", content: "Voorspel de uitslagen van Nederland op het WK 2026. Doe mee met de DutchMSP poule!" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/8d6bf8f5-c92e-4494-b48b-d526db36c0e0" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/8d6bf8f5-c92e-4494-b48b-d526db36c0e0" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('dutchmsp-theme');if(t&&['oranje','reinier','roland'].indexOf(t)>=0){document.documentElement.setAttribute('data-theme',t);}}catch(e){}",
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="pixel-grid-bg flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
      </div>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
