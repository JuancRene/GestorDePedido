import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "./components/auth-provider"
import { OfflineInitializer } from "./components/offline-initializer"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "La Pecosa - Administración",
  metadataBase: new URL('http://localhost:3000'),
  description: "Sistema de administración para La Pecosa",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <OfflineInitializer />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}



import './globals.css'