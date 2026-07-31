import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    turbopack: { root: import.meta.dirname },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: '*.backblazeb2.com' },
        ],
    },
    serverExternalPackages: ['mysql2', 'ioredis', 'bcryptjs'],
    typedRoutes: true,
};

export default nextConfig;
