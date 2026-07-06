import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nigeria Security Watch - Conflict & Casualty Tracker",
  description:
    "Tracking security incidents and conflict-related casualties across Nigeria.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Suspense>
          <Nav />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
