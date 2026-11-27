import "./globals.css";
import { Inter } from "next/font/google";
import AppProviders from "@/providers/AppProviders";

// The one family the whole product is set in. `--font-inter` is what
// `globals.css` points `--font-sans`, `--font-serif` and `--font-mono` at, so
// every `font-*` utility in the app resolves here — see the type block there.
//
// Playfair Display and Space Grotesk used to be loaded beside it. Neither was
// ever referenced by a single class or token, so both were two font downloads
// per page load for nothing.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Cool Nerdz",
  description: "Elite Masterminds Life Education LMS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${inter.className} antialiased overflow-x-hidden bg-porcelain text-ink`}
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
