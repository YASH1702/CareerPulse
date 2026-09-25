import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "CareerPulse",
    template: "%s | CareerPulse",
  },
  description: "Find the right jobs. Apply smarter.",
  keywords: ["job search", "AI", "resume", "career"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0a0f1e] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
