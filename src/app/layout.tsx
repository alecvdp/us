import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Us",
  description: "Shared household dashboard for Alec & Pau",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Us",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1E2127",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={atkinson.className}>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
