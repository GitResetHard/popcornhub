import { Clapperboard } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-6 py-8">
            <Link href="/" className="flex items-center justify-center gap-2 text-lg font-semibold">
                <Clapperboard className="text-primary size-6" />
                Moviestrackr
            </Link>
            {children}
        </div>
    );
}
