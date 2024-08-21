import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const titleStyles = cva(
    'font-semibold',
    {
        variants: {
            variant: {
                h1: 'text-3xl font-bold',
                h2: 'text-2xl font-semibold',
                h3: 'text-xl font-semibold',
                h4: 'text-h4',
                h5: 'text-sub_1',
                h6: 'text-sub_2',
            },
            isGradient: {
                true: 'textGradient',
            },
        },
        defaultVariants: {
            isGradient: false,
        },
    }
);

type TitleProps = VariantProps<typeof titleStyles> & {
    title: string;
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    className?: string;
};

export default function Heading({
    title,
    variant = 'h1',
    isGradient = false,
    as,
    className
}: TitleProps) {
    const Title = as || variant;
    const HeadingElement = typeof Title === 'string' ? Title : 'h1';
    return (
        <HeadingElement
            className={titleStyles({ variant, isGradient, className })}
        >
            {title}
        </HeadingElement>
    );
};

