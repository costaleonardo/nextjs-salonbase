import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SalonBase - Salon Management Platform",
  description: "Reliable salon management with payment processing you can trust",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5, // Allow pinch-to-zoom for accessibility
    userScalable: true,
  },
  themeColor: '#2563eb', // Blue-600 brand color
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SalonBase',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
