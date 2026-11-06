import type { Metadata } from 'next'
import Link from 'next/link'
import { Compass, ShieldCheck } from 'lucide-react'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { ToastProvider } from '@/components/providers/ToastProvider'

export const metadata: Metadata = {
  title: {
    default: 'CampusFind — Lost & Found Platform',
    template: '%s | CampusFind',
  },
  description: 'CampusFind connects students, faculty, and staff to recover lost belongings securely at Amal Jyothi College of Engineering.',
  keywords: ['lost and found', 'campus', 'AJCE', 'Amal Jyothi', 'college', 'lost items', 'found items'],
  authors: [{ name: 'CampusFind' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm tracking-tight block">CampusFind</span>
                    <span className="text-[11px] text-slate-500">Amal Jyothi College of Engineering · Kanjirappally</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
                  <Link href="/" className="hover:text-white transition-colors">Home</Link>
                  <Link href="/lost-items" className="hover:text-white transition-colors">Lost Items</Link>
                  <Link href="/found-items" className="hover:text-white transition-colors">Found Items</Link>
                  <Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
                  <Link href="/report/lost" className="text-red-400 hover:text-red-300 transition-colors">Report Lost</Link>
                  <Link href="/report/found" className="text-green-400 hover:text-green-300 transition-colors">Report Found</Link>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
                <p>© {new Date().getFullYear()} CampusFind. Built for campus safety & convenience.</p>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Verified Campus Platform</span>
                </div>
              </div>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  )
}
