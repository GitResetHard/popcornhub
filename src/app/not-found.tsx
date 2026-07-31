import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="py-20 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
            <p className="text-muted-foreground mt-2 text-sm">The page you were looking for does not exist or has moved.</p>
            <Button asChild className="mt-6">
                <Link href="/">Back to home</Link>
            </Button>
        </div>
    );
}
