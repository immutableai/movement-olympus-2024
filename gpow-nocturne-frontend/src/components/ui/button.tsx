import * as React from "react"
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"


const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow hover:bg-primary/90",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
                outline:
                    "border border-input bg-primary shadow-sm text-white hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "dark:bg-card/60 bg-accent/20 text-secondary-foreground shadow-sm hover:bg-secondary/60 hover:dark:bg-card/40",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-blue-600 underline-offset-4 hover:underline p-0",
                secondaryLink: "bg-accent/90 dark:bg-secondary/80 text-secondary-foreground shadow-sm dark:hover:bg-secondary hover:bg-accent",
                disabled: "border border-input bg-gray-400 shadow-sm text-white cursor-not-allowed disabled"
            },
            size: {
                default: "h-9 px-4 py-3",
                full: "w-full h-16",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-10 rounded-md px-8",
                icon: "h-14 w-14",
                iconSm: "h-8 w-8",
                link: "h-auto p-0"
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)


export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean,
    link?: string,
    target?: string
}

export default function Button({ className, variant, size, title, asChild = false, link = "", target, ...props }: ButtonProps) {
    if (asChild) {
        return (
            <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
        )
    }

    if (link) {
        return (
            <Link href={link} className={cn(buttonVariants({ variant, size, className }))} target={target}> {title} </Link>
        )
    }

    return (
        <button className={cn(buttonVariants({ variant, size, className }))} {...props}>{title}</button>
    )
}
