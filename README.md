# aptos-immutableai

# Tap Train Coin Distribution Service

This service is designed to automate the distribution of coins earned by users in the Tap Train game. It operates on a scheduled basis, interacting with the game's database and a smart contract on the Movement Network.

## Overview

The service performs the following key functions:

1. Queries the User table in the Tap Train game database on a regular schedule.
2. Calculates the coin earnings delta for each user since the last run.
3. Bundles user earnings data with their Web3 wallet information.
4. Submits this data to the Jobs contract on the Movement Network.
5. Monitors the Jobs contract for completion or failure events.
6. Updates the local database to reflect the payout status.

## Components

### Scheduler

The service uses a cron-like scheduler to trigger its operations at regular intervals. This ensures timely processing of user earnings and consistent interaction with the blockchain.

### Database Interaction

- Connects to the Tap Train game database.
- Queries the User table to retrieve current coin balances and wallet information.
- Calculates the coin delta by comparing current balances with the last recorded payout.

### Blockchain Interaction

- Connects to the Movement Network.
- Interacts with the Jobs contract to submit bundled user data and coin deltas.
- Listens for events from the Jobs contract indicating job completion or failure.

### Bookkeeping

- Updates the local database to reflect the status of payouts (completed, failed, or pending).
- Maintains a record of processed transactions for auditing and error recovery.

## Workflow

1. The scheduler triggers the service at the predetermined interval.
2. The service queries the User table and calculates coin deltas.
3. User data is bundled and submitted to the Jobs contract.
4. The service enters a listening state, waiting for completion/failure events.
5. Upon receiving an event, the service updates the local database accordingly.

## Configuration

The service requires configuration for:

- Database connection details
- Movement Network connection details
- Jobs contract address
- Scheduler interval settings

## Dependencies

- Database driver (specific to the Tap Train game database)
- Web3 library for blockchain interactions
- Event listening mechanism (e.g., WebSocket)
- Scheduling library

## Deployment

Service will be deployed to GKE as a cron job.

## Monitoring and Logging

TBDD: Discuss monitoring and logging strategies.

## Error Handling

TBD: Discuss error handling strategies and best practices.

## Security Considerations

TBD: Discuss any security considerations or best practices related to this service.

## Contributing

TBD: Guidelines for contributing to this service. Internal documentation, guidelines, and code standards will be outlined here.

## License

Internal License
