import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PreferencesProvider } from "@/context/PreferencesContext";
import { PresenceManager } from "@/components/PresenceManager";

export const metadata: Metadata = {
  title: "Nexus Task - SaaS Management",
  description: "Next-gen task management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <PreferencesProvider>
            <PresenceManager />
            {children}
          </PreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
