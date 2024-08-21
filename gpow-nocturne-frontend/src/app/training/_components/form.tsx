"use client"
import UploadDataToIPFS from "@/components/upload-data-ipfs";

export default function Form() {
    return (
        <div className="w-full space-y-8">
            <h1 className="text-3xl font-bold text-center text-white">Upload a file to start training</h1>
            <div className="flex flex-col justify-between gap-4">
                <UploadDataToIPFS />
            </div>
        </div>
    );
}

