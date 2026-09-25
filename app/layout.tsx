import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Noto_Sans_Myanmar, Poppins, PT_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin"],
  weight: "700",
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const notoSansMyanmar = Noto_Sans_Myanmar({
  variable: "--font-noto-myanmar",
  subsets: ["myanmar"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NihonGo",
  description:
    "AI-powered Japanese language-school interview practice — CSC 485 / CSC 492",
};

export default function RootLayout({
  children,
  modal,
}: LayoutProps<"/"> & { modal?: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${ptSerif.variable} ${poppins.variable} ${notoSansMyanmar.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div id="nihongo-route" className="flex min-h-full flex-1 flex-col">
          {children}
        </div>
        {modal}
      </body>
    </html>
  );
}
