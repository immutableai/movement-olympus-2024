import { Account, Aptos, AccountAddressInput } from "@aptos-labs/ts-sdk";
import { TAP_TRAIN_CONTRACT_ADDRESS } from "./types/env";
import { submitTransaction } from "./helpers/submit-transaction";

const MODULE_NAME = 'fungible_asset';

enum TapTrainFunction {
    GET_META_DATA = 'get_metadata',
    MINT = 'mint',
    BURN = 'burn',
    TRANSFER = 'transfer',
}

export class TapTrain {
    constructor(private aptos: Aptos) { }

    async getMetaData() {
        return await this.aptos.view({
            payload: {
                function: `${TAP_TRAIN_CONTRACT_ADDRESS}::${MODULE_NAME}::${TapTrainFunction.GET_META_DATA}`,
                typeArguments: [],
                functionArguments: [],
            }
        });
    }

    async mint(sender: Account, receiver: AccountAddressInput, amount: number) {
        return submitTransaction(this.aptos, sender, TAP_TRAIN_CONTRACT_ADDRESS, MODULE_NAME, TapTrainFunction.MINT, [receiver, amount]);
    }
}
