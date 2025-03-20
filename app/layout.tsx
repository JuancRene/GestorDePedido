import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "./components/auth-provider"
import { ServiceWorkerRegistration } from "./components/service-worker-registration"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "La Pecosa - Administración",
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
          {children}
          <Toaster />
          <ServiceWorkerRegistration />
        </AuthProvider>
      </body>
    </html>
  )
}



import './globals.css'