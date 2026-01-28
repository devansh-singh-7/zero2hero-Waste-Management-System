"use client"

import { useState } from "react"
import { Inter } from 'next/font/google'
import "./globals.css"
import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from "@/components/providers/AuthProvider"
import { NavigationLoader } from "@/components/NavigationLoader"

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="//fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <NavigationLoader />
          <div className="min-h-screen bg-white flex flex-col">
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex flex-1">
              <Sidebar open={sidebarOpen} />
              <main className="flex-1 p-4 lg:p-8 ml-0 lg:ml-64 transition-all duration-300">
                {children}
              </main>
            </div>
          </div>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                style: {
                  background: '#ffffff',
                  color: '#059669',
                  border: '1px solid #d1fae5',
                },
                iconTheme: {
                  primary: '#059669',
                  secondary: '#ffffff',
                },
              },
              error: {
                style: {
                  background: '#ffffff',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                },
                iconTheme: {
                  primary: '#dc2626',
                  secondary: '#ffffff',
                },
              },
              loading: {
                style: {
                  background: '#ffffff',
                  color: '#3b82f6',
                  border: '1px solid #dbeafe',
                },
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
