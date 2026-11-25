import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Self-hosted Ubuntu fonts: the build must not depend on fetching
// from Google Fonts at build time (deployment environments may be offline).
const ubuntuSans = localFont({
  variable: "--font-ubuntu",
  src: [
    { path: "../fonts/ubuntu-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/ubuntu-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ubuntu-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/ubuntu-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
});

const ubuntuMono = localFont({
  variable: "--font-ubuntu-mono",
  src: [
    { path: "../fonts/ubuntu-mono-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ubuntu-mono-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aquatic Link Solutions, Tilapia Fingerlings, Equipment & Training | Akuse, Ghana",
  description:
    "Order quality tilapia fingerlings, fish farming equipment and training from ALS in Akuse, Ghana. Browse live availability, send your order on WhatsApp, get a branded receipt and track every order.",
  keywords: [
    "tilapia fingerlings Ghana",
    "fish farming Ghana",
    "aquaculture Akuse",
    "ALS fingerlings",
    "Volta River cage farming",
    "fish farm training Ghana",
  ],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "Aquatic Link Solutions, order fingerlings, equipment and training",
    description:
      "Quality tilapia fingerlings from our hatchery in Akuse, Eastern Region. 17+ years of aquaculture. Order online, pay by MoMo or bank, track every order.",
    siteName: "Aquatic Link Solutions",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f766e",
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
      className={`${ubuntuSans.variable} ${ubuntuMono.variable}`}
    >
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
