import json
import os
from dataclasses import field
from datetime import UTC, datetime
import tempfile
from typing import Dict, List
import yaml

import ipfsApi

from aptos_sdk.account import Account
from aptos_sdk.async_client import RestClient
from aptos_sdk.transactions import (
    EntryFunction,
    TransactionArgument,
    TransactionPayload,
    Serializer,
)

from pydantic.dataclasses import dataclass
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tap_train.db import get_async_db, models, schemas
from tap_train.config.logging import configure_logging
from tap_train.db.models.user_settings import UserSettingKeys
from tap_train.db.schemas.user import ChainPaymentStatus
from tap_train.game import crud

logger = configure_logging()

NODE_URL = "https://aptos.testnet.suzuka.movementlabs.xyz/v1"
JOB_CONTRACT_ADDRESS = (
    "0x33fb744c44cddf9f5833be88e59c30852ef7f3cadbda428dc09b220b6c3a19eb"
)

ipfs_api = ipfsApi.Client("localhost", 5001)


@dataclass
class MoveAccount:
    address: str
    private_key: str


@dataclass
class UserPayment:
    user_id: int
    amount: int
    payment_id: int
    wallets: Dict[str, str] = field(default_factory=dict)
    status: ChainPaymentStatus = ChainPaymentStatus.PENDING


@dataclass
class IpfsFile:
    hash: str
    name: str


class NocturneJobClient:
    def __init__(self, node_url: str, contract_address: str):
        self.client = RestClient(node_url)
        self.contract_address = contract_address

    async def submit_job(
        self, account: Account, cid_manifest: str, task_count: int, tip: int = None
    ):
        payload = EntryFunction.natural(
            f"{self.contract_address}::job",
            "submit",
            [],
            [
                TransactionArgument(cid_manifest, Serializer.str),
                TransactionArgument(task_count, Serializer.u32),
                (
                    TransactionArgument(tip, Serializer.u64)
                    if tip is not None
                    else TransactionArgument(0, Serializer.u64)
                ),
            ],
        )
        signed_transaction = await self.client.create_bcs_signed_transaction(
            account, TransactionPayload(payload)
        )
        return await self.client.submit_bcs_transaction(signed_transaction)

    async def claim_job(self, account: Account, job_id: int):
        payload = EntryFunction.natural(
            f"{self.contract_address}::job",
            "claim",
            [],
            [TransactionArgument(job_id, Serializer.u64)],
        )
        signed_transaction = await self.client.create_bcs_signed_transaction(
            account, TransactionPayload(payload)
        )
        return await self.client.submit_bcs_transaction(signed_transaction)

    async def claim_first_job(self, account: Account):
        payload = EntryFunction.natural(
            f"{self.contract_address}::job", "claim_first", [], []
        )
        signed_transaction = await self.client.create_bcs_signed_transaction(
            account, TransactionPayload(payload)
        )
        return await self.client.submit_bcs_transaction(signed_transaction)

    async def fail_job(self, account: Account, job_id: int, task_id: int):
        payload = EntryFunction.natural(
            f"{self.contract_address}::job",
            "fail",
            [],
            [
                TransactionArgument(job_id, Serializer.u64),
                TransactionArgument(task_id, Serializer.u64),
            ],
        )
        signed_transaction = await self.client.create_bcs_signed_transaction(
            account, TransactionPayload(payload)
        )
        return await self.client.submit_bcs_transaction(signed_transaction)

    async def complete_job(
        self, account: Account, job_id: int, task_id: int, cid_result: str
    ):
        payload = EntryFunction.natural(
            f"{self.contract_address}::job",
            "complete",
            [],
            [
                TransactionArgument(job_id, Serializer.u64),
                TransactionArgument(task_id, Serializer.u64),
                TransactionArgument(cid_result, Serializer.str),
            ],
        )
        signed_transaction = await self.client.create_bcs_signed_transaction(
            account, TransactionPayload(payload)
        )
        return await self.client.submit_bcs_transaction(signed_transaction)

    async def cancel_job(self, account: Account, job_id: int):
        payload = EntryFunction.natural(
            f"{self.contract_address}::job",
            "cancel",
            [],
            [TransactionArgument(job_id, Serializer.u64)],
        )
        signed_transaction = await self.client.create_bcs_signed_transaction(
            account, TransactionPayload(payload)
        )
        return await self.client.submit_bcs_transaction(signed_transaction)

    async def get_jobs(self):
        return await self.client.view_function(
            f"{self.contract_address}::job", "get_jobs", []
        )

    async def get_job_status(self, job_id: int):
        return await self.client.view_function(
            f"{self.contract_address}::job", "get_job_status", [job_id]
        )

    async def get_jobs_by_creator(self, creator_address: str, job_status: int = None):
        return await self.client.view_function(
            f"{self.contract_address}::job",
            "get_jobs_by_creator",
            [creator_address, job_status],
        )

    async def get_jobs_by_worker(self, worker_address: str, job_status: int = None):
        return await self.client.view_function(
            f"{self.contract_address}::job",
            "get_jobs_by_worker",
            [worker_address, job_status],
        )

    async def has_worker(self, worker_address: str, task_status: int, job_id: int):
        return await self.client.view_function(
            f"{self.contract_address}::job",
            "has_worker",
            [worker_address, task_status, job_id],
        )


def load_key(file: str) -> MoveAccount:
    file = os.path.expanduser(file)
    with open(file, "r") as f:
        data = yaml.safe_load(f)
        return MoveAccount(address=data["address"], private_key=data["private_key"])


async def submit_payment_batch(
    transactions: List[UserPayment],
    ipfs_hash: IpfsFile,
):
    # Blargh - don't need to load each batch but time is of the essence bwaaaaaaaaa
    key: MoveAccount = load_key(os.getenv("KEY_FILE"))
    account: Account = Account(account_address=key.address, private_key=key.private_key)

    # public entry fun submit(caller: &signer, cid_manifest: String, task_count: u32, tip: Option<u64>) acquires NocturneJob {
    nocturne_job_client: NocturneJobClient = NocturneJobClient(
        NODE_URL, JOB_CONTRACT_ADDRESS
    )

    # Create a new job
    submit_tx: str = await nocturne_job_client.submit_job(
        account,
        ipfs_hash.hash,
        1,
        None,
    )

    return submit_tx


async def process_payments(payments: List[UserPayment], batch_size: int = 10000):
    # Iterate through payments in batches of 100 and submit to jobs contract
    for i in range(0, len(payments), batch_size):
        batch = payments[i : min(i + batch_size, len(payments))]

        # Write batch to a temporary JSON file
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False
        ) as temp_file:
            json.dump([payment.__dict__ for payment in batch], temp_file, default=str)
            temp_file_path = temp_file.name

        print(f"Batch written to temporary file: {temp_file_path}")

        # Call the IPFS API to upload the file
        ipfs_hash = ipfs_api.add(temp_file_path)
        ipfs_file = IpfsFile(hash=ipfs_hash[0]["Hash"], name=ipfs_hash[0]["Name"])

        await submit_payment_batch(batch, ipfs_file)


async def create_user_payment(
    db: AsyncSession, user_id: int, user_total_coins_collected: int
) -> UserPayment:
    # Instantiate a chain payment for this cycle for the user
    chain_payment = models.UserChainPayment(
        user_id=user_id,
        total_paid=0,
        last_paid_earned_amount=user_total_coins_collected,
        last_updated_at=datetime.now(UTC),
        status=ChainPaymentStatus.PENDING,
    )

    # Get the most recent chain payment for the user
    result = await db.execute(
        select(schemas.UserChainPayment)
        .filter(schemas.UserChainPayment.user_id == user_id)
        .order_by(schemas.UserChainPayment.created_at.desc())
        .limit(1)
    )
    last_chain_payment = result.scalar_one_or_none()

    # If there is a last chain payment, use it to set the last paid earned amount
    if last_chain_payment and last_chain_payment.status == ChainPaymentStatus.COMPLETED:
        chain_payment.last_paid_earned_amount = (
            last_chain_payment.last_paid_earned_amount
        )
        db.add(last_chain_payment)

    # We need to calculate the total paid for this cycle
    chain_payment.total_paid = (
        chain_payment.last_paid_earned_amount - user_total_coins_collected
    )

    # Add the chain payment to the database
    db_chain_payment: schemas.UserChainPayment = schemas.UserChainPayment(
        **chain_payment.model_dump()
    )
    db.add(db_chain_payment)
    await db.commit()

    return UserPayment(
        user_id=user_id,
        amount=chain_payment.total_paid,
        payment_id=db_chain_payment.id,
        status=ChainPaymentStatus.PENDING,
    )


async def main():
    logger.debug("Starting token distribution service")

    user_payment_list: List[UserPayment] = []
    async for db in get_async_db():
        for user in await crud.get_users(db, pagination=False):
            user: models.UserForChainActivity = (
                models.UserForChainActivity.model_validate(user.__dict__)
            )

            logger.debug(f"Processing user {user.id}:{user.username}")

            # Get user settings, if none, skip
            user_settings = await crud.get_user_settings(db, user.id)
            if not user_settings:
                logger.debug(f"User {user.id} has no settings saved, skipping")
                continue

            # Convert user settings to model
            user_settings: models.UserSettings = models.UserSettings.model_validate(
                user_settings.__dict__
            )

            # Check if user has web3 wallet saved, if not, skip
            settings = user_settings.settings
            if (
                UserSettingKeys.WEB3_WALLET_MOVE.value not in settings
                and UserSettingKeys.WEB3_WALLET_TON.value not in settings
            ):
                logger.debug(f"User {user.id} has no web3 wallet saved, skipping")
                continue

            # Add the user payment to the list
            try:
                user_payment = await create_user_payment(
                    db, user.id, user.total_coins_collected
                )
            except Exception as e:
                logger.error(
                    f"Error creating user payment for user {user.id}: {e}",
                    exc_info=True,
                )
                continue

            # Add the user payment to the list
            if user_payment:
                for k, v in settings.items():
                    if k == UserSettingKeys.WEB3_WALLET_MOVE.value:
                        user_payment.wallets["move"] = v
                    elif k == UserSettingKeys.WEB3_WALLET_TON.value:
                        user_payment.wallets["ton"] = v

                user_payment_list.append(user_payment)

    # Submit the payments to the chain
    await process_payments(user_payment_list)


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
