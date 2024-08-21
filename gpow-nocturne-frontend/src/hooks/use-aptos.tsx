"use client";

import toast from "react-hot-toast";
import { useWallet, WalletInfo } from "@aptos-labs/wallet-adapter-react";
import { CONTRACT_ADDRESS } from "@/constants/selectFields";
import {
  Aptos,
  AptosConfig,
  Network,
  UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { WalletName } from "@aptos-labs/wallet-adapter-react";

export default function useAptos() {
  const {
    connect,
    account,
    connected,
    signAndSubmitTransaction,
    wallets,
    network,
    changeNetwork,
  } = useWallet();
  const aptos = new Aptos(
    new AptosConfig({
      network: Network.CUSTOM,
      fullnode: "https://aptos.testnet.suzuka.movementlabs.xyz/v1",
    })
  );

  const submitJob = async (
    cidManifest: string,
    taskCount: number,
    walletName: string
  ) => {
    if (!connected) {
      const selectedWallet = wallets!.find(
        (wallet) => wallet.name === (walletName as WalletName<string>)
      );
      if (selectedWallet) {
        console.log("Connecting to wallet...");
        connect(selectedWallet.name);
      } else {
        console.error("Invalid wallet name");
        return;
      }
    }

    // TODO:
    // if (network?.name !== Network.CUSTOM) {
    //   const res = await changeNetwork(Network.CUSTOM);
    //   if (!res.success) {
    //     toast.error(res.reason || "Failed to change network");
    //     return;
    //   }
    // }

    try {
      // TODO: Get gas limit
      console.log("Submitting job...");
      console.log("Account address:", account?.address);
      const tx = await signAndSubmitTransaction({
        sender: account?.address || "",
        data: {
          function: `${CONTRACT_ADDRESS}::job::submit`,
          functionArguments: [cidManifest, taskCount, 0], // Option types are not recognized in entry functions yet, must include a 3rd param
        },
      });
      console.log(
        `View transaction at: https://explorer.movementnetwork.xyz/txn/${tx.hash}?network=testnet`
      );
      const txReceipt = await aptos.waitForTransaction({
        transactionHash: tx.hash,
      });
      console.dir(txReceipt, { depth: null });
      if (
        (txReceipt as UserTransactionResponse).events[0].type ===
        `${CONTRACT_ADDRESS}::job::JobSubmitted`
      ) {
        toast.success("Job created successfully!");
      } else {
        toast.error("Job creation failed!");
      }
    } catch (error: any) {
      //   if (error.message.includes("1010")) {
      //     console.error(
      //       "Invalid Transaction: Inability to pay some fees, e.g., account balance too low."
      //     );
      //     toast.error("Failed! Your account balance is too low.");
      //   } else {
      //     console.log("Error interacting with the contract: " + error.message);
      //   }
      console.log(error);
    }
  };
  return {
    submitJob,
  };
}
