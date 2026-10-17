import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Token Launch Kit · Base Sepolia demo",
  description:
    "Portfolio demo by Japheth Studios: fixed-supply ERC-20 and cliff vesting on Base Sepolia testnet. Not a real token.",
};

export const viewport: Viewport = { themeColor: "#0b0f17", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
