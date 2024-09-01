// import { Aptos, Account, TransactionResponse, PendingTransactionResponse } from "@aptos-labs/ts-sdk";

// export async function submitTransaction(
//     aptos: Aptos,
//     account: Account,
//     contractAddress: string,
//     moduleName: string,
//     functionName: string,
//     functionArgs: any[]
// ): Promise<PendingTransactionResponse | TransactionResponse> {
//     const txn = await aptos.transaction.build.simple({
//         sender: account.accountAddress,
//         data: {
//             function: `${contractAddress}::${moduleName}::${functionName}`,
//             typeArguments: [],
//             functionArguments: functionArgs,
//         },
//     });

//     console.log("Transaction executed", txn);

//     const committedTxn = await aptos.signAndSubmitTransaction({
//         signer: account,
//         transaction: txn,
//     });
//     console.log("Transaction Committed", committedTxn);

//     const executedTransaction = await aptos.waitForTransaction({
//         transactionHash: committedTxn.hash,
//     });
//     console.log("Transaction hash:", executedTransaction.hash);
//     console.log(
//         `View transaction at: https://explorer.movementnetwork.xyz/txn/${committedTxn.hash}?network=testnet`
//     );

//     return executedTransaction;
// }

import { Aptos, Account, TransactionResponse, PendingTransactionResponse } from "@aptos-labs/ts-sdk";

export async function submitTransaction(
    aptos: Aptos,
    account: Account,
    contractAddress: string,
    moduleName: string,
    functionName: string,
    functionArgs: any[]
): Promise<PendingTransactionResponse | TransactionResponse> {
    const txn = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: {
            function: `${contractAddress}::${moduleName}::${functionName}`,
            typeArguments: [],
            functionArguments: functionArgs,
        },
    });

    console.log("Transaction executed:", txn);

    const committedTxn = await aptos.signAndSubmitTransaction({
        signer: account,
        transaction: txn,
    });
    console.log("Transaction committed:", committedTxn);

    const executedTransaction = await aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
    });
    console.log("Transaction hash:", executedTransaction.hash);
    console.log(
        `View transaction at: https://explorer.movementnetwork.xyz/txn/${committedTxn.hash}?network=testnet`
    );

    return executedTransaction;
}

