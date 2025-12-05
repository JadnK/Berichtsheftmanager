import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Berichtsheft Manager - KI-gestützte Berichtshefterstellung",
  description: "Verwalte deine wöchentlichen Berichtshefte und verbessere sie mit KI-Unterstützung. Perfekt für Azubis und Ausbilder.",
  keywords: ["Berichtsheft", "Azubi", "KI", "Next.js", "TypeScript", "Tailwind CSS", "Ausbildung"],
  authors: [{ name: "Berichtsheft Manager Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Berichtsheft Manager",
    description: "KI-gestützte Verwaltung von wöchentlichen Berichtsheften für Azubis",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Berichtsheft Manager",
    description: "KI-gestützte Verwaltung von wöchentlichen Berichtsheften für Azubis",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
