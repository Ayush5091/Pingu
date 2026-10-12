"use client";

import { usePathname, useRouter } from "next/navigation";
import Navigation from "./Navigation";
import AicteAssistant from "./AicteAssistant";
import Pingu from "./pingu/Pingu";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function PinguLoader({ label = "Waddling over..." }: { label?: string }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-snow" role="status">
            <Pingu mood="happy" size={96} />
            <p className="font-display text-lg font-semibold text-ink-soft">{label}</p>
        </div>
    );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading, isInitializing } = useAuth();
    const reduce = useReducedMotion();
    const isPublicPage = pathname === '/login' || pathname?.startsWith('/auth/') || pathname === '/register' || pathname === '/demo' || (pathname === '/' && !user);

    useEffect(() => {
        // Wait until we're absolutely certain auth is initialized
        if (!isInitializing && !user && !isPublicPage) {
            router.push('/login');
        }
    }, [isInitializing, user, isPublicPage, router]);

    if (isInitializing || isLoading) {
        return <PinguLoader />;
    }

    return (
        <div className="flex min-h-screen w-full max-w-full overflow-x-clip bg-snow">
            {!isPublicPage && <Navigation />}
            <main className={`flex-1 min-w-0 w-full max-w-full overflow-x-clip ${isPublicPage ? '' : 'pb-24 md:ml-64 md:pb-0'}`}>
                <motion.div
                    key={pathname}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                    {children}
                </motion.div>
            </main>
            <AicteAssistant hasBottomNav={!isPublicPage || pathname === '/demo'} />
        </div>
    );
}
