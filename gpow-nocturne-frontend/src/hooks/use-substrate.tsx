"use client"
import { useContext } from "react"
import { SubstrateContext } from "@/context/substrate-context"
import { web3FromAddress } from '@polkadot/extension-dapp';
import { BN } from '@polkadot/util';
import { ApiPromise } from "@polkadot/api";
import { ContractPromise } from "@polkadot/api-contract";
import { ContractOptions } from "@polkadot/api-contract/types";
import type { ContractExecResult } from "@polkadot/types/interfaces";

import toast from "react-hot-toast";

export default function useSubstrate() {
    const substrate = useContext(SubstrateContext);

    const toU32 = (value: number) => {
        // Ensure the value is a number
        if (typeof value !== 'number') {
            throw new TypeError('The value must be a number');
        }

        // Create a Uint32Array with one element
        const u32Array = new Uint32Array([value]);

        // The first (and only) element of the array is the converted u32 value
        return u32Array[0];
    }

    const toContractAbiMessage = (
        contractPromise: ContractPromise,
        message: string
    ) => {
        const value = contractPromise.abi.messages.find((m) => m.method === message);

        if (!value) {
            const messages = contractPromise?.abi.messages
                .map((m) => m.method)
                .join(", ");

            const error = `"${message}" not found in metadata.spec.messages: [${messages}]`;
            console.error(error);

            return { ok: false, error };
        }

        return { ok: true, value };
    };

    const getGasLimit = async (
        api: ApiPromise,
        userAddress: string,
        message: string,
        contract: ContractPromise,
        options = {} as ContractOptions,
        args = [] as unknown[]
        // temporarily type is Weight instead of WeightV2 until polkadot-js type `ContractExecResult` will be changed to WeightV2
    ) => {
        const abiMessage = toContractAbiMessage(contract, message);
        if (!abiMessage.ok) return abiMessage;

        const { value, gasLimit, storageDepositLimit } = options;

        const { gasRequired } =
            await api.call.contractsApi.call<ContractExecResult>(
                userAddress,
                contract.address,
                value ?? new BN(0),
                gasLimit ?? null,
                storageDepositLimit ?? null,
                abiMessage?.value?.toU8a(args)
            );

        return { ok: true, value: gasRequired };
    };

    const submitJob = async (cidManifest: string, taskCount: number, wallet: string) => {
        const { state }: any = substrate;

        if (state.apiState === "DISCONNECT") {
            toast.error("RPC connect failed!");
            return;
        }
        else if (!state.contract) {
            toast.error("Contract instance creation failed!");
            return;
        }
        else if (!wallet) {
            toast.error("Please connect your wallet!");
            return;
        }

        const taskCountArray = toU32(taskCount);

        try {
            const injector = await web3FromAddress(wallet);

            const gasLimitResult = await getGasLimit(
                state.api,
                wallet,
                "submit",
                state.contract,
                { value: 0 },
                [
                    cidManifest,
                    taskCountArray
                ]
            );

            if (!gasLimitResult.ok) {
                return;
            }

            const unsub = await state.contract.tx.submit(
                { value: 0, gasLimit: gasLimitResult.value },
                cidManifest,
                taskCountArray
            ).signAndSend(wallet, { signer: injector.signer },
                ({ events = [], status }: any) => {
                    events.forEach(({ event }: any) => {
                        console.log("event", event);
                        const { method } = event;
                        if (method === "ExtrinsicSuccess" && status.type === "InBlock") {
                            toast.success("Job created successfully!");
                            return;
                        } else if (method === "ExtrinsicFailed") {
                            console.log(`An error occured: ${method}.`);
                            toast.error("Job creation failed!");
                            return;
                        }
                    });
                }
            );
        } catch (error: any) {
            if (error.message.includes('1010')) {
                console.error('Invalid Transaction: Inability to pay some fees, e.g., account balance too low.');
                toast.error("Failed! Your account balance is too low.");
            } else {
                console.log('Error interacting with the contract: ' + error.message);
            }
        };
    }
    return {
        substrate,
        submitJob,
    }
}