import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aquatic Link Solutions — Tilapia Fingerlings, Equipment & Training | Akuse, Ghana",
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
    title: "Aquatic Link Solutions — order fingerlings, equipment and training",
    description:
      "Quality tilapia fingerlings from our hatchery in Akuse, Eastern Region. 17+ years of aquaculture. Order online, pay by MoMo or bank, track every order.",
    siteName: "Aquatic Link Solutions",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
