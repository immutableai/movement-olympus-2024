# Aptos Blockchain Job Processor

This project is a TypeScript-based application that interacts with the Aptos blockchain using Movement Testnet to monitor and manage jobs within the Nocturne Job contract. It also integrates with the TapTrain fungible asset contract to process and manage in-game assets as part of the job management workflow.

## Features

- **Listen for New Jobs**: Continuously monitors the blockchain for new job events.
- **Claim Jobs**: Automatically claims new jobs for a specified account.
- **Process Jobs**: Processes claimed jobs using the TapTrain contract, minting in-game assets based on job details.
- **Job Management**: Allows for job status checks, job claims, and job completions or failures.

## Project Structure

- **`nocturne-job.ts`**: Contains classes for reading job details (`ReadonlyJob`) and submitting job transactions (`SubmitJobs`).
- **`taptrain.ts`**: Provides functionalities for interacting with the TapTrain fungible asset contract.
- **`index.ts`**: Entry point that initializes blockchain connections, sets up listeners for job events, and processes jobs.

## TODOs

- Implement detailed job processing logic using the TapTrain contract.
- Retrieve dynamic values (like the amount to mint) based on job details.

## Prerequisites

- Node.js (v14 or later)
- An Aptos account with a private key (for proof of concept only; this will be replaced when integrated with the client).
- Access to the Movement Testnet

## Installation

- Clone the repo

```bash
  git clone https://github.com/immutableai/movement-olympus-2024
```

- Navigate to the project directory

```bash
    cd taptrain-job-listener
```

- Install pnpm

```
    npm install -g pnpm
```

- Install the dependencies

```bash
    pnpm i
```

- Rename the .env.example to .env and put your actual keys

## Start the server

```
    pnpm start
```
