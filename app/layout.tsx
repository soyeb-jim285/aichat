import { type Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Add display swap for better font loading
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Add display swap for better font loading
});

export const metadata: Metadata = {
  title: "AI Chat Application",
  description: "Chat with AI using Gemini 2.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background antialiased">
        <ClerkProvider>
          <div className="relative flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-end border-b bg-background px-4 gap-4">
              <SignedOut>
                <SignInButton mode="modal" />
                <SignUpButton mode="modal" />
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </header>
            <main className="flex-1">
              {children}
            </main>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}