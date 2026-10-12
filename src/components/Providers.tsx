"use client";

import { AuthProvider } from '@/lib/contexts/AuthContext';
import React from 'react';
import { MotionConfig } from 'framer-motion';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <MotionConfig reducedMotion="user">
            <AuthProvider>
                {children}
            </AuthProvider>
        </MotionConfig>
    );
}
