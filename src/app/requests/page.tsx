"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PinguLoader } from "@/components/ClientLayout";

// Requests now live in the unified activity log.
export default function RequestsRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/submissions-history");
    }, [router]);
    return <PinguLoader />;
}
