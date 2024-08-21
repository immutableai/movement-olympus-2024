"use client"
import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import ErrorMessage from './error-message';

type SelectOption = {
    label: string;
    value: string;
};

type SelectBoxProps = {
    title: string;
    options: SelectOption[];
    register?: UseFormRegisterReturn;
    errorMsg?: string;
};

const SelectBox: React.FC<SelectBoxProps> = ({
    title,
    options,
    register,
    errorMsg,
}) => {
    return (
        <div className="space-y-1">
            <label htmlFor={title} >
                {title}
            </label>
            <select
                {...register}
                id={title}
                className="outline-none border rounded-md px-2 py-4 bg-transparent w-full border-primaryCTA"
            >
                <option value="">Choose your {title.toLowerCase()}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {errorMsg && <ErrorMessage errorMsg={errorMsg} />}
        </div>
    );
};

export default SelectBox;