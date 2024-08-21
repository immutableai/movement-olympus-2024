"use client";
import { useState } from "react";
import Link from "next/link";
import useFileUpload from "@/hooks/use-upload-file";
import UploadFile from "@/components/ui/upload-file";
import FileIcon from "@/components/svg/file-icon";
import Button from "@/components/ui/button";
import useIpfs from "@/hooks/use-ipfs";

export default function UploadDataToIPFS() {
    const [cid, setCid] = useState<string>("");
    const { uploadDataUsingKubo } = useIpfs();
    const {
        codeFiles,
        fileName,
        dragging,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDrop,
        handleUpload,
        removeFiles,
    } = useFileUpload();

    const onSubmit = async (e: any) => {
        e.preventDefault();
        if (codeFiles.length === 0) {
            console.error("No files to upload.");
            return;
        }

        try {
            const data = await uploadDataUsingKubo(codeFiles[0]);
            setCid(data?.path ?? "");
        } catch (error) {
            console.error("Error uploading to IPFS:", error);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-3">
            {cid !== "" && (
                <div className="text-white text-md">
                    Data uploaded to IPFS:{" "}
                    <Link href={`http://localhost:8080/ipfs/${cid}`} className="text-blue-400" target="_blank">{cid}</Link>
                </div>
            )}
            <div className=" w-full h-64 border rounded-lg text-white">
                {codeFiles.length === 0 && (
                    <UploadFile
                        dragging={dragging}
                        handleUpload={handleUpload}
                        handleDragEnter={handleDragEnter}
                        handleDragLeave={handleDragLeave}
                        handleDragOver={handleDragOver}
                        handleDrop={handleDrop}
                    />
                )}
                {codeFiles.length !== 0 && fileName !== "" && (
                    <div className="w-full h-full grid place-content-center">
                        <div className="relative mx-auto w-fit flex flex-col justify-center">
                            <div
                                className="absolute top-0 right-0 bg-destructive text-white w-8 h-8 grid place-items-center  rounded-full cursor-pointer"
                                onClick={removeFiles}
                            >
                                x
                            </div>
                            <FileIcon />
                        </div>
                        <span>{fileName}</span>
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-3 w-full">
                <Button
                    title="Upload"
                    variant={`${codeFiles.length === 0 ? "disabled" : "outline"}`}
                    size="full"
                    type="submit"
                />
            </div>
        </form>
    );
}
