import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Local network dashboard",
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
