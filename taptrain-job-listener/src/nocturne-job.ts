import { Account, AccountAddressInput, Aptos, MoveValue, TransactionResponse } from "@aptos-labs/ts-sdk";
import { JOB_CONTRACT_ADDRESS } from "./types/env";
import { JobType } from "./types/job";
import { submitTransaction } from "./helpers/submit-transaction";

enum JobFunction {
    GET_JOBS = 'get_jobs',
    GET_JOB_STATUS = 'get_job_status',
    GET_JOBS_BY_CREATOR = 'get_jobs_by_creator',
    GET_JOBS_BY_WORKER = 'get_jobs_by_worker',
    HAS_WORKER = 'has_worker',
    CLAIM_JOB = 'claim',
    JOB_FAILED = 'fail',
    JOB_COMPLETE = 'complete'
}

const MODULE_NAME = 'job';

export class ReadonlyJob {
    constructor(private aptos: Aptos) { }

    private async viewFunction(functionName: JobFunction, functionArguments: any[] = [], typeArguments: any[] = []): Promise<any> {
        const payload = {
            function: `${JOB_CONTRACT_ADDRESS}::${MODULE_NAME}::${functionName}` as `${string}::${string}::${string}`,
            typeArguments,
            functionArguments
        };
        return await this.aptos.view({ payload });
    }

    async getJobs(): Promise<MoveValue[]> {
        return this.viewFunction(JobFunction.GET_JOBS);
    }

    async getJobStatus(jobId: number): Promise<any> {
        return this.viewFunction(JobFunction.GET_JOB_STATUS, [jobId]);
    }

    async getJobsByCreator(creatorAddress: string, jobStatus?: number): Promise<any> {
        return this.viewFunction(JobFunction.GET_JOBS_BY_CREATOR, [creatorAddress, jobStatus]);
    }

    async getJobsByWorker(worker: AccountAddressInput, jobStatus?: number): Promise<any> {
        return this.viewFunction(JobFunction.GET_JOBS_BY_WORKER, [worker, jobStatus]);
    }

    async jobHasWorker(worker: string, taskStatus: number, jobId: number): Promise<any> {
        return this.viewFunction(JobFunction.HAS_WORKER, [worker, taskStatus, jobId]);
    }

    async getContractInfo(): Promise<{ accountInfo: any, balanceInfo: any, jobInfo: any }> {
        const res = await this.aptos.getAccountResources({ accountAddress: JOB_CONTRACT_ADDRESS });

        return {
            accountInfo: res.find((item) => item.type === '0x1::account::Account')?.data,
            balanceInfo: res.find((item) => item.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>')?.data,
            jobInfo: res.find((item) => item.type === `${JOB_CONTRACT_ADDRESS}::job::NocturneJob`)?.data
        };
    }

    async listenForNewJobs(callback: (jobs: JobType[]) => void): Promise<void> {
        let lastJobCount = 0;

        const checkForNewJobs = async () => {
            try {
                console.log("Checking new job events...");
                const jobs = await this.getJobs();
                const allJobs = jobs[0] as any[];
                if (allJobs?.length > lastJobCount) {
                    const newJobs = allJobs.slice(lastJobCount);
                    callback(newJobs as JobType[]);
                    lastJobCount = allJobs.length;
                }
            } catch (error) {
                console.error("Error checking for new jobs:", error);
            }
        };

        await checkForNewJobs();
        setInterval(checkForNewJobs, 5000);
    }
}

export class SubmitJobs {
    constructor(private aptos: Aptos) { }

    async claim(account: Account, jobId: number): Promise<TransactionResponse> {
        return submitTransaction(this.aptos, account, JOB_CONTRACT_ADDRESS, MODULE_NAME, JobFunction.CLAIM_JOB, [jobId]);
    }

    async complete(account: Account, jobId: number, taskId: number, cidResult: string): Promise<TransactionResponse> {
        return submitTransaction(this.aptos, account, JOB_CONTRACT_ADDRESS, MODULE_NAME, JobFunction.JOB_COMPLETE, [jobId, taskId, cidResult]);
    }

    async fail(account: Account, jobId: number, taskId: number): Promise<TransactionResponse> {
        return submitTransaction(this.aptos, account, JOB_CONTRACT_ADDRESS, MODULE_NAME, JobFunction.JOB_FAILED, [jobId, taskId]);
    }
}

