import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

type CheckboxProps = {
    label: string;
    register?: UseFormRegisterReturn;
    className?: string;
};

const Checkbox: React.FC<CheckboxProps> = ({
    label,
    register,
    className,
}) => {
    return (
        <div className={`flex items-center ${className}`}>
            <input
                {...register}
                type="checkbox"
                id={label.toLowerCase().replace(/\s+/g, '-')}
                className="mr-2"
            />
            <label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>{label}</label>
        </div>
    );
};

export default Checkbox;