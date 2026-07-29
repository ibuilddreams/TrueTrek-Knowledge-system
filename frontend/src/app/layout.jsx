import "./globals.css";
import { Inter, Playfair_Display, Space_Grotesk } from "next/font/google";
import AppProviders from "@/providers/AppProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "TrueTrek Learning",
  description: "Elite Masterminds Life Education LMS",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${spaceGrotesk.variable}`}
    >
      <body
        className={`${inter.className} antialiased overflow-x-hidden bg-[#faf9f6] text-stone-900`}
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
