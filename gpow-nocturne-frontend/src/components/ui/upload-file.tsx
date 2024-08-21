import React from "react";
import UploadIcon from "../svg/upload-icon";

type UploadFileProps = {
    dragging: boolean;
    handleUpload: (e: any) => Promise<string | void>;
    handleDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDrop: (e: React.DragEvent<HTMLDivElement>) => Promise<string | void>;
};

export default function UploadFile({
    dragging,
    handleUpload,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
}: UploadFileProps) {
    return (
        <div className="flex h-full justify-center">
            <div className="w-full bg-transparent">
                <div className="flex h-full">
                    <div
                        className={`flex items-center justify-center w-full overflow-hidden  rounded-lg border-blue-200 border-dashed ${dragging ? "bg-blue-200" : ""
                            }`}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <label className="flex flex-col justify-center items-center w-full h-full  cursor-pointer">
                            <div className="flex flex-col items-center justify-center pt-7">
                                <UploadIcon />
                                <p className="pt-1 text-sm tracking-wider">
                                    Drag & Drop or browse{" "}
                                </p>
                            </div>
                            <input
                                type="file"
                                className="opacity-0"
                                onChange={handleUpload}
                                accept="file/*"
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
