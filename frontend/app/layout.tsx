import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
 
export const metadata: Metadata = {
  title: "Lemontree Volunteer Hub",
  description: "Connect volunteers with food access resources in your community",
};
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
 