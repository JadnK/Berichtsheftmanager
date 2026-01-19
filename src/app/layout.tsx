import type { Metadata } from "next";
import { Lexend, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Berichtsheft Manager - KI-gestutzte Berichtshefterstellung",
  description:
    "Verwalte deine wochentlichen Berichtshefte und verbessere sie mit KI-Unterstutzung. Perfekt fur Azubis und Ausbilder.",
  keywords: [
    "Berichtsheft",
    "Azubi",
    "KI",
    "TypeScript",
    "Tailwind CSS",
    "Ausbildung",
  ],
  authors: [{ name: "Berichtsheft Manager Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Berichtsheft Manager",
    description:
      "KI-gestutzte Verwaltung von wochentlichen Berichtsheften fur Azubis",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Berichtsheft Manager",
    description:
      "KI-gestutzte Verwaltung von wochentlichen Berichtsheften fur Azubis",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="dark" suppressHydrationWarning>
      <body className={`${lexend.variable} ${jetbrainsMono.variable} antialiased`}>
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
