"use client"
import { useState, useEffect } from "react";
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Enable, web3Accounts } from '@polkadot/extension-dapp';


export default function usePolkadot() {
    const [api, setApi] = useState<ApiPromise>();
    const [allAccounts, setAllAccounts] = useState<any[]>([]);

    const setup = async () => {
        const wsProvider = new WsProvider(process.env.NEXT_PUBLIC_SUBSTRATE_NODE || "");
        const api = await ApiPromise.create({ provider: wsProvider });
        setApi(api)
    }

    useEffect(() => {
        const connectWallet = async () => {
            try {
                // Enable the Polkadot.js extension
                const extensions = await web3Enable('gpow-nocturne-frontend');

                if (extensions.length === 0) {
                    console.log('No extension found');
                    return;
                }

                const allAccounts = await web3Accounts();
                setAllAccounts(allAccounts);
            } catch (error) {
                console.error('Error connecting to Polkadot.js extension:', error);
            }
        };

        connectWallet();
    }, []);

    useEffect(() => {
        setup()
    }, []);


    return {
        api,
        allAccounts,
    };
}