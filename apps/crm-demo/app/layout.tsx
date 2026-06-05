import type { Metadata } from "next";
import "./globals.css";
import { demoConfig } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: `${demoConfig.productName} | ${demoConfig.demoCompanyName}`,
  description: "A self-contained, interactive CRM demo template with mock sales data."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
