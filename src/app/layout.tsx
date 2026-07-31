import type { Metadata } from 'next';
import { Urbanist } from 'next/font/google';
import { Toaster } from 'sonner';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import './globals.css';

const urbanist = Urbanist({ subsets: ['latin'], variable: '--font-urbanist', display: 'swap' });

export const metadata: Metadata = {
    title: { default: 'Moviestrackr', template: '%s · Moviestrackr' },
    description: 'Track your watchlist, rate and review movies and TV shows, follow friends, and never miss an episode.',
    icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`dark ${urbanist.variable}`}>
            <body className="font-sans antialiased">
                <div className="flex min-h-screen flex-col overflow-x-clip">
                    <SiteHeader />
                    <main className="container mx-auto min-w-0 flex-1 px-4 py-6 sm:py-8">{children}</main>
                    <SiteFooter />
                </div>
                <Toaster position="bottom-right" richColors />
            </body>
        </html>
    );
}
