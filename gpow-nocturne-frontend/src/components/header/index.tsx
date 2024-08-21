import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
    return (
        <header>
            <nav className="flex justify-center items-center h-24 px-[12%] bg-primary">
                <Link href="/" className="text-white">
                    <Image src="/logo.png" width={300} height={200} alt='Immutable Labs' className='invert' />
                </Link>
            </nav>
        </header>
    )
}
