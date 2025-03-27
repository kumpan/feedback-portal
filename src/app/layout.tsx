import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const APP_NAME = "Feedback Portal";
const APP_DEFAULT_TITLE = "Feedback Portal | Kumpan";
const APP_TITLE_TEMPLATE = "%s | Kumpan";
const APP_DESCRIPTION =
  "Help us here at Kumpan to improve. We would love to collect insights and feedback from our beloved clients.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_DEFAULT_TITLE,
    startupImage: [],
  },
  icons: {
    apple: [
      { url: "/icons/icon-152x152.png" },
      { url: "/icons/icon-180x180.png", sizes: "180x180" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  metadataBase: new URL("https://feedback.kumpan.se"),
  alternates: {
    canonical: "./",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} font-sans selection:bg-foreground selection:text-background antialiased bg-primary-90 text-foreground overflow-y-auto scrollbar-gutter-stable`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
