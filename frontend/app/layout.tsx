// app/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";

import Header from "../components/mw-layout/Header";
import Footer from "../components/mw-layout/Footer";
import "./globals.css";

import { GoogleOAuthProvider } from "@react-oauth/google";

export const metadata: Metadata = {
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
  const content = (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );

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
