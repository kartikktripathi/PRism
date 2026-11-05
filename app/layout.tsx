import Providers from "@/app/providers";
import "./globals.css";
import { Geist, Geist_Mono, DM_Sans } from "next/font/google";

export const metadata = {
  title: "PRism",
  description:
    "An Open Sourcerer's Playground to track, review, and merge pull requests.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const removeAttrs = function() {
                    const els = document.querySelectorAll('[bis_skin_checked]');
                    for (let i = 0; i < els.length; i++) {
                      els[i].removeAttribute('bis_skin_checked');
                    }
                  };
                  removeAttrs();
                  window.addEventListener('DOMContentLoaded', removeAttrs);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${dmSans.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
