"use client"
import dynamic from 'next/dynamic';

const SubstrateProvider = dynamic(() => import("@/context/substrate-context"), { ssr: false })

export default function SubstrateNodeProvider({ children }: { children: React.ReactNode }) {
    return (
        <SubstrateProvider>
            {children}
        </SubstrateProvider>
    )
}
