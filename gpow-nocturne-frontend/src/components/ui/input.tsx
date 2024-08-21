import React from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'
import ErrorMessage from './error-message'

type Input = {
    title: string,
    type?: string,
    placeholder: string,
    value?: number,
    register?: UseFormRegisterReturn,
    errorMsg?: string
}

export default function InputBox({ title, type, placeholder, value, register, errorMsg }: Input) {
    return (
        <div className="space-y-1">
            <label htmlFor={title}>{title}</label>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                className='outline-none border rounded-md p-4 bg-transparent w-full border-primaryCTA'
                {...register}
            />
            <div><ErrorMessage errorMsg={errorMsg} /></div>
        </div>
    )
}