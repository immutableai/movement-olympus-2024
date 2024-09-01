import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey, AptosApiError, AccountAddressInput } from "@aptos-labs/ts-sdk";
import 'dotenv/config';
import { ReadonlyJob, SubmitJobs } from "./nocturne-job";
import { JobStatus, JobType } from "./types/job";
import { APTOS_ACCOUNT_PRIVATE_KEY } from "./types/env";
import { TapTrain } from "./taptrain";

/* The account defination from private key is only for the demo purpose 
Because for executing transaction we need to pass account info associtated with the job
*/
const privateKey = new Ed25519PrivateKey(APTOS_ACCOUNT_PRIVATE_KEY);
const account = Account.fromPrivateKey({ privateKey });

//Aptos Configuration using Movement Testnet
const aptos = new Aptos(new AptosConfig({
    network: Network.CUSTOM,
    fullnode: "https://aptos.testnet.suzuka.movementlabs.xyz/v1",
}));


const NoctruneGetJobs = new ReadonlyJob(aptos);
const NocturneSubmitJob = new SubmitJobs(aptos);
const TapTrainJob = new TapTrain(aptos);

async function claimAndProcessJob(account: Account, job_id: number, task_id: number, cid_result: string, receiver_account: AccountAddressInput) {
    console.log("PROCESSING JOB WITH JOB ID:", job_id);
    try {
        const jobStatus = await NoctruneGetJobs.getJobStatus(job_id);

        switch (jobStatus[0]) {
            case JobStatus.FAILED:
                console.log("Job failed, cannot claim.");
                await NocturneSubmitJob.fail(account, job_id, task_id);
                break;

            case JobStatus.IN_PROGRESS:
                console.log("Claim job...", jobStatus);
                const claimResponse = await NocturneSubmitJob.claim(account, job_id);
                console.log("Claimed job with response:", claimResponse);
                // TODO: Process job using TapTrain contract mint function
                // await TapTrainJob.mint(account, receiver_account, 100); // Retrieve the amount from the JOB
                break;

            default:
                console.log("Job status not handled:", jobStatus);
                break;
        }
    } catch (error: any) {
        console.error("Error processing job claim:", error.message || error);
    }
}

async function listenForJobs() {
    console.log("Starting to listen for new jobs...");

    const handleNewJobs = async (newJobs: JobType[]) => {
        console.log("New jobs detected!");


        for (let i = 0; i < newJobs.length; i++) {
            const job_id = i;
            const task_id = 1;
            const creator_account = newJobs[i].creator;
            const cid_result = newJobs[i]?.cid_results;

            await claimAndProcessJob(account, job_id, task_id, '', creator_account); //Pass the correct task id and cid_results once the contract is fully configured
        }

    };

    await NoctruneGetJobs.listenForNewJobs(handleNewJobs);
}

listenForJobs();
