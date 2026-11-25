import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Self-hosted brand fonts (Spectral for headings, Public Sans for body and
// interface): the build must not depend on fetching from Google Fonts at
// build time, deployment environments may be offline.
const spectral = localFont({
  variable: "--font-spectral",
  src: [
    { path: "../fonts/spectral-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/spectral-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/spectral-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
});

const publicSans = localFont({
  variable: "--font-public",
  src: [
    { path: "../fonts/public-sans-var.woff2", weight: "100 900", style: "normal" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aquatic Link Solutions, Tilapia Fingerlings, Aquaculture Training | Akuse, Ghana",
  description:
    "Aquatic Link Solutions produces quality tilapia fingerlings in Akuse, Eastern Region, and raises market-size tilapia in cages on the Volta River. Free fish farming training, equipment marketplace, partnership and investment enquiries.",
  keywords: [
    "tilapia fingerlings Ghana",
    "fish farming Ghana",
    "aquaculture Akuse",
    "ALS fingerlings",
    "Volta River cage farming",
    "fish farm training Ghana",
    "aquaculture investment Ghana",
  ],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "Aquatic Link Solutions, quality tilapia fingerlings from Akuse, Ghana",
    description:
      "Quality tilapia fingerlings from our hatchery in Akuse, Eastern Region, cage grow-out on the Volta River and free fish farming training for women, persons with disabilities and farmers.",
    siteName: "Aquatic Link Solutions",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0F3D3E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spectral.variable} ${publicSans.variable}`}
    >
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
