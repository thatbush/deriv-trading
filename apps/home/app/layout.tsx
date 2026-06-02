import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Shell } from "@/components/shell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Binary Matix",
  description: "Binary Matix trading tools powered by Deriv API",
  icons: { icon: "/bm-logo-w.jpeg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="h-full overflow-hidden">
        <Shell isDev={process.env.NODE_ENV === 'development'}>{children}</Shell>
      </body>
    </html>
  );
}
