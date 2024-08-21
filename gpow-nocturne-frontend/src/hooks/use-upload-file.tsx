"use client"
import { useState, useCallback } from "react";
import toast from "react-hot-toast";

export default function useFileUpload() {
    const [codeFiles, setCodeFiles] = useState<File[]>([]);
    const [fileName, setFileName] = useState<string>("");
    const [dragging, setDragging] = useState(false);

    const maxAllowedFiles = 1;

    const handleUpload = useCallback(async (e: any): Promise<string | void> => {
        e.preventDefault();
        const files = e.target.files;
        if (files.length > maxAllowedFiles || (codeFiles && codeFiles.length > maxAllowedFiles)) {
            toast.error("You can't upload more than 1 code file")
            return;
        }

        setCodeFiles([files[0]]);
        setFileName(files[0]?.name)
    }, [codeFiles]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(true);
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>): Promise<string | void> => {
        e.preventDefault();
        setDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > maxAllowedFiles || (codeFiles && codeFiles.length > maxAllowedFiles)) {
            toast.error("You can't upload more than 1 code file")
            return;
        }
        // Reading and returning contents of the code file
        setCodeFiles([droppedFiles[0]]);
        setFileName(droppedFiles[0]?.name)
    }, [codeFiles]);

    const removeFiles = () => {
        setCodeFiles([]);
        setFileName("");
    }


    return {
        codeFiles,
        fileName,
        dragging,
        handleUpload,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDrop,
        removeFiles
    };
}