const FOOTER_LINKS = [
    { href: '/about', label: 'About' },
    { href: '/guide', label: 'Guide' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
    { href: '/cookies', label: 'Cookies' },
];

export function SiteFooter() {
    return (
        <footer className="mt-12 border-t py-8">
            <div className="text-muted-foreground container mx-auto flex flex-col items-center gap-4 px-4 text-sm sm:flex-row sm:justify-between">
                <p>
                    Movie and TV data provided by{' '}
                    <a href="https://www.themoviedb.org/" className="hover:text-foreground underline" target="_blank" rel="noreferrer noopener">
                        TMDB
                    </a>
                    .
                </p>
                <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                    {FOOTER_LINKS.map(({ href, label }) => (
                        <a key={href} href={href} className="hover:text-foreground">
                            {label}
                        </a>
                    ))}
                </nav>
            </div>
        </footer>
    );
}
