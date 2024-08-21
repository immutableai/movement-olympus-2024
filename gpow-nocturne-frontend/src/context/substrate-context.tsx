"use client";
import React, { useReducer, useEffect, createContext, ReactNode, useCallback } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';

import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { ContractPromise } from '@polkadot/api-contract';
import abi from '@/lib/abi.json';

interface SubstrateState {
    socket: string;
    api: ApiPromise | null;
    allAccounts: InjectedAccountWithMeta[];
    currentAccount: InjectedAccountWithMeta | null;
    apiState: string | null;
    apiError?: any;
    contract: ContractPromise | null;
    contractState: string | null;
}

interface SubstrateAction {
    type: string;
    payload?: any;
}

const initialState: SubstrateState = {
    socket: process.env.NEXT_PUBLIC_SUBSTRATE_NODE || "",
    api: null,
    allAccounts: [],
    currentAccount: null,
    apiState: null,
    apiError: null,
    contract: null,
    contractState: null,
};

const reducer = (state: SubstrateState, action: SubstrateAction): SubstrateState => {
    switch (action.type) {
        case 'CONNECT_INIT':
            return { ...state, apiState: 'CONNECT_INIT', contractState: 'CONTRACT_INIT' };
        case 'CONNECT':
            return { ...state, apiState: 'CONNECTING' };
        case 'CONNECT_SUCCESS':
            return { ...state, api: action.payload, apiState: 'READY' };
        case 'CONNECT_ERROR':
            return { ...state, apiState: 'ERROR', apiError: action.payload };
        case 'DISCONNECT':
            return { ...state, apiState: 'DISCONNECT' };
        case 'SET_ACCOUNTS':
            return { ...state, allAccounts: action.payload };
        case 'SET_ACCOUNT':
            return { ...state, currentAccount: action.payload };
        case 'SET_CONTRACT':
            return { ...state, contract: action.payload, contractState: 'READY' };
        default:
            return state;
    }
};

const connect = async (socket: string, dispatch: React.Dispatch<SubstrateAction>) => {
    dispatch({ type: 'CONNECT_INIT' });

    try {
        const provider = new WsProvider(socket);
        const api = await ApiPromise.create({ provider });

        api.on('connected', () => {
            dispatch({ type: 'CONNECT' })
            // `ready` event is not emitted upon reconnection and is checked explicitly here.
            api.isReady.then(api => dispatch({ type: 'CONNECT_SUCCESS', payload: api }))
        })
        api.on('ready', () => dispatch({ type: 'CONNECT_SUCCESS' }))
        api.on('error', err => dispatch({ type: 'CONNECT_ERROR', payload: err }));
        api.on('disconnected', () => dispatch({ type: 'DISCONNECT' }));

        await api.isReady;
        console.log("CONNECT_SUCCESS");
        dispatch({ type: 'CONNECT_SUCCESS', payload: api });

        const contract = new ContractPromise(
            api,
            abi,
            process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
        );
        dispatch({ type: 'SET_CONTRACT', payload: contract });

    } catch (error) {
        dispatch({ type: 'CONNECT_ERROR', payload: error });
    }
};

const loadAccounts = async (dispatch: React.Dispatch<SubstrateAction>) => {
    try {
        const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');
        const extensions = await web3Enable('gpow-nocturne-frontend');

        if (extensions.length === 0) {
            console.log('No extension found');
            return;
        }

        const allAccounts = await web3Accounts();
        dispatch({ type: 'SET_ACCOUNTS', payload: allAccounts });
        dispatch({ type: 'SET_ACCOUNT', payload: allAccounts[0] });
    } catch (error) {
        console.error('Error connecting to Polkadot.js extension:', error);
    }
}

export const SubstrateContext = createContext<{ state: SubstrateState; dispatch: React.Dispatch<SubstrateAction> } | undefined>(undefined);

const SubstrateProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    const memoizedConnect = useCallback(() => connect(state.socket, dispatch), [state.socket, dispatch]);
    const memoizedLoadAccounts = useCallback(() => loadAccounts(dispatch), [dispatch]);

    useEffect(() => {
        memoizedConnect();
        memoizedLoadAccounts();
    }, [memoizedConnect, memoizedLoadAccounts]);

    return (
        <SubstrateContext.Provider value={{ state, dispatch }}>
            {children}
        </SubstrateContext.Provider>
    );
};

export default SubstrateProvider;
