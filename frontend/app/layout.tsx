// app/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";

import AppShell from "../components/mw-layout/AppShell";
import { getSiteUrl } from "../lib/site";
import "./globals.css";

import { GoogleOAuthProvider } from "@react-oauth/google";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "MetalWolft",
    template: "%s | MetalWolft",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const content = <AppShell>{children}</AppShell>;

  return (
    <html lang="es">
      <body>
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            {content}
          </GoogleOAuthProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
