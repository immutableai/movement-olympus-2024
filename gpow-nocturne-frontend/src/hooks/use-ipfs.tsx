"use client";
import axios from "axios";
import { create } from "kubo-rpc-client";
import { PinataSDK } from "pinata";

export default function useIpfs() {
  const URL = process.env.NEXT_PUBLIC_IPFS_NODE_URL || "";
  const uploadFileToIPFS = async (file: File) => {
    if (!file) {
      console.error("No file provided for upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${URL}/api/v0/add`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 10000, // Optional: Add a timeout for the request
      });

      if (response.status === 200 && response.data) {
        return response.data;
      } else {
        console.error(
          `Unexpected response: ${response.status} - ${response.statusText}`
        );
      }
    } catch (error: any) {
      if (error.response) {
        console.error(
          `Error uploading file: ${error.response.status} - ${error.response.statusText}`
        );
      } else if (error.request) {
        console.error("Error: No response received from IPFS node.");
      } else {
        console.error(`Error setting up request: ${error.message}`);
      }
    }
  };

  const uploadDataUsingKubo = async (file: File | string) => {
    if (!file) {
      console.error("No file provided for upload.");
      return;
    }

    try {
      console.log("Uploading data using Kubo...");
      const client = create({ url: `${URL}` });
      const response = await client.add(file);

      if (response && response.path) {
        return response;
      } else {
        console.error("Unexpected response from IPFS node.");
      }
    } catch (error: any) {
      console.error(`Error uploading data using Kubo: ${error.message}`);
    }
  };

  const uploadDataUsingPinata = async (file: File | string) => {
    if (!file) {
      console.error("No file provided for upload.");
      return;
    }
    try {
      console.log("Uploading data using Pinata...");

      const jwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIzMDEyMjc0Yy1lNmJjLTQ4NzMtYTg3Yi0zMDNlOGE1NDdhYjMiLCJlbWFpbCI6InJldmFudGguZ3VuZGFsYUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZjlmYzg1ZTAxYWIwYmI4Y2IwNWIiLCJzY29wZWRLZXlTZWNyZXQiOiJmMWRlYjZjNDkyMDdhYjc3YjAxNDk1MzI3N2NkYjUyZjBiYzQwOGY0YTIwYmMxMTk3MmYwN2U0NGE4ZmI4NWI3IiwiZXhwIjoxNzU1NTc5MDc1fQ.Wpz5_Y1AdExzPR3W1qF6LVEkjSS5MSYU1CR8Os_smE0";
      const pinata = new PinataSDK({
        pinataJwt: jwt,
      });
      const uploadFile = new File([file], "file.txt");
      const upload = await pinata.upload.file(uploadFile);
      console.log("Uploaded file:", upload);
      return upload;
    } catch (error: any) {
      console.error(`Error uploading data using Kubo: ${error.message}`);
    }
  };

  return {
    uploadFileToIPFS,
    uploadDataUsingKubo,
    uploadDataUsingPinata,
  };
}
