import type { Metadata } from "next";
import { Roboto } from "next/font/google";

import { Providers } from "@/app/providers";

import "@/app/globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["400", "500", "700", "900"]
});

export const metadata: Metadata = {
  title: "Temple Gold Rush",
  description: "A real-time web version of Incan Gold for 2 to 4 players."
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  return (
    <html lang="en">
      <body className={`${roboto.className} ${roboto.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
