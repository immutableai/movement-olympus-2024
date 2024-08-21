"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import useAptos from "@/hooks/use-aptos";
import { JobFormData, jobFormSchema } from "@/utils/form-schema";

import {
  Heading,
  InputBox,
  SelectBox,
  Checkbox,
  UploadFile,
  Button,
} from "../ui";

import FileIcon from "../svg/file-icon";
import useIpfs from "@/hooks/use-ipfs";
import useFileUpload from "@/hooks/use-upload-file";

import { options, dockerImages, jobTypes } from "@/constants/selectFields";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
//import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";

export default function SubmitJobForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
  });

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

  //   const [account, setAccount] = useState<options[]>([]);
  const [jobManifestHash, setJobManifestHash] = useState<string>("");
  const [walletName, setWalletName] = useState<string>("");
  const { submitJob } = useAptos();
  const { uploadDataUsingKubo, uploadDataUsingPinata } = useIpfs();

  //   useEffect(() => {
  //     setAccount(
  //       state.allAccounts.map((account: any) => ({
  //         label: account.meta.name,
  //         value: account.address,
  //       }))
  //     );
  //   }, [state.allAccounts]);

  const onSubmit = async (data: JobFormData) => {
    if (codeFiles.length <= 0) {
      toast.error("Please upload a file!");
      return;
    }

    const { wallet, includeLogs, dockerImage, jobType, taskName } = data;
    setWalletName(wallet);

    // const uploadDataToIPFS = await uploadDataUsingKubo(codeFiles[0]);
    const uploadDataToIPFS = await uploadDataUsingPinata(codeFiles[0]);

    if (!uploadDataToIPFS) {
      toast.error("Error uploading file to IPFS");
      return;
    }

    const jobManifest = {
      owner: wallet,
      id: taskName,
      jobType: jobType,
      tasks: [
        {
          id: crypto.randomUUID(),
          name: taskName,
          includeLogs: includeLogs,
          data: {
            filename: codeFiles[0]?.name,
            cid: uploadDataToIPFS.IpfsHash.toString(),
          },
          logs: null,
          image: dockerImage,
          tag: null,
          command: "echo",
          args: null,
          env: null,
          workDir: null,
          timeout: null,
          delay: null,
          restartDelay: null,
          maxRestarts: null,
          maxRuntime: null,
          maxMemory: null,
          maxCpu: null,
          maxDisk: null,
          maxBandwidth: null,
        },
      ],
    };

    const jobManifestSchema = JSON.stringify(jobManifest);
    const uploadJobManifestToIPFS = await uploadDataUsingPinata(
      jobManifestSchema
    );

    if (!uploadJobManifestToIPFS) {
      toast.error("Error uploading job manifest to IPFS");
      return;
    }

    const jobManifestCID = uploadJobManifestToIPFS?.IpfsHash.toString();
    setJobManifestHash(jobManifestCID);
    toast.success("Job manifest uploaded!");
  };

  const submitJobToAptos = () => {
    submitJob(jobManifestHash, 5, walletName);
    clearFields();
  };

  const clearFields = () => {
    reset();
    removeFiles();
    setJobManifestHash("");
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Heading title="Job Submission Form" variant="h1" />
        {jobManifestHash !== "" && (
          <Button
            variant="link"
            size="link"
            link={`http://green-entitled-bovid-242.mypinata.cloud/ipfs/${jobManifestHash}`}
            target="_blank"
            title="View Job Manifest"
          />
        )}
        {jobManifestHash !== "" && (
          <Button
            variant="secondaryLink"
            title="Submit New Job"
            onClick={submitJobToAptos}
          />
        )}
      </div>
      <hr className="bg-black h-[0.1rem]" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
        <div className="flex gap-4">
          <div className="flex-1">
            <InputBox
              title="Task Name"
              type="text"
              placeholder="Enter job name"
              register={register("taskName")}
              errorMsg={errors.taskName?.message}
            />
          </div>
          <div className="flex-1">
            <SelectBox
              title="Docker Image"
              options={dockerImages}
              register={register("dockerImage")}
              errorMsg={errors.dockerImage?.message}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <SelectBox
              title="Job Type"
              options={jobTypes}
              register={register("jobType")}
              errorMsg={errors.jobType?.message}
            />
          </div>
          <div className="flex-1">
            {/* <WalletSelector /> */}
            <SelectBox
              title="Wallet"
              options={[{ label: "Petra", value: "Petra" }]}
              register={register("wallet")}
              errorMsg={errors.wallet?.message as string}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="upload data">Upload Data</label>
          <div className=" w-full h-64 border rounded-lg ">
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
                    className="absolute top-0 right-0 text-white bg-destructive w-8 h-8 grid place-items-center  rounded-full cursor-pointer"
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
        </div>

        <Checkbox
          label="Include Logs"
          register={register("includeLogs")}
          className="mb-4"
        />
        <hr className="bg-black h-[0.1rem]" />
        <div className="flex justify-center">
          <Button
            title="Submit Job"
            variant="default"
            type="submit"
            size="lg"
            disabled={codeFiles?.length <= 0}
          />
        </div>
      </form>
    </div>
  );
}
