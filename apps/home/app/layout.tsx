import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Shell } from "@/components/shell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = "https://binarymatix.com";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Binary Matix — Synthetic Indices Trading",
    template: "%s | Binary Matix",
  },
  description:
    "Professional trading tools for synthetic indices. Digits, Accumulators, and Rise & Fall contracts powered by the Deriv API. Clean interface, fast execution.",
  keywords: [
    "synthetic indices trading",
    "binary options",
    "Deriv API",
    "digits trading",
    "accumulators",
    "rise and fall",
    "trading platform",
    "Binary Matix",
  ],
  authors: [{ name: "Binary Matix", url: SITE_URL }],
  creator: "Binary Matix",
  publisher: "Binary Matix",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: SITE_URL,
    siteName: "Binary Matix",
    title: "Binary Matix — Synthetic Indices Trading",
    description:
      "Professional trading tools for synthetic indices. Digits, Accumulators, and Rise & Fall contracts powered by the Deriv API.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Trade smarter, on your terms. Start trading synthetic indices with Binary Matix.",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Binary Matix — Synthetic Indices Trading",
    description:
      "Professional trading tools for synthetic indices powered by the Deriv API.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/bm-logo-w.jpeg",
    apple: "/bm-logo-w.jpeg",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Binary Matix",
  url: SITE_URL,
  description:
    "Professional trading tools for synthetic indices. Digits, Accumulators, and Rise & Fall contracts powered by the Deriv API.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  publisher: {
    "@type": "Organization",
    name: "Binary Matix",
    url: SITE_URL,
    email: "support@binarymatix.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="h-full overflow-hidden">
        <Shell isDev={process.env.NODE_ENV === 'development'}>{children}</Shell>
        <script
          dangerouslySetInnerHTML={{
            __html: `var Tawk_API=Tawk_API||{},Tawk_LoadStart=new Date();(function(){var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];s1.async=true;s1.src='https://embed.tawk.to/67651740af5bfec1dbdeb697/1ifhe5lmn';s1.charset='UTF-8';s1.setAttribute('crossorigin','*');s0.parentNode.insertBefore(s1,s0);})();`,
          }}
        />
      </body>
    </html>
  );
}
