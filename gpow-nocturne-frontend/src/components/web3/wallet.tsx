"use client";
import React from "react";
import usePolkadot from "@/hooks/use-polkadot";

export default function Wallets() {
  const { allAccounts } = usePolkadot();

  return (
    <div className="max-w-fit">
      <div className="flex gap-2">
        <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          {allAccounts?.map((account: any) => (
            <option key={account.address} value={account.address}>
              {account.meta.name.toUpperCase()}: {account.address}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
