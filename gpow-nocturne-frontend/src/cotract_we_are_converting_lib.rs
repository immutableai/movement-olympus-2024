#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod nocturne_job {
    use ink::env::{account_id, block_timestamp, DefaultEnvironment};
    use ink::prelude::string::String;
    use ink::prelude::{vec, vec::Vec};
    use ink::storage::StorageVec;

    //-- Errors
    /// Errors that can occur upon calling this contract.
    #[derive(Clone, Copy, Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        /// Returned if the job submition fails for any reason.
        SubmitFailed,

        /// Returned if the job claim fails for any reason.
        ClaimFailed,

        /// Returned if claim request finds no available jobs.
        NoJobs,

        /// Returned if the job update fails for any reason.
        UpdateFailed,

        /// Returned if the job completion fails for any reason.
        Failed,

        /// Returned if the caller is not the owner of the job.
        NotOwner,

        /// Returned if the caller is not a worker of the job.
        NotWorker,

        /// Returned if the caller is already a worker of a job.
        CallerBusy,
    }
    //-- End of Errors

    //-- Events
    /// JobSubmitted event
    /// This event is emitted when a new job is submitted successfully
    /// The event contains the creator of the job and the job id
    /// The job id is the index of the job in the jobs storage
    #[ink(event)]
    pub struct JobSubmitted {
        /// The creator of the job
        #[ink(topic)]
        creator: AccountId,

        /// The job id
        #[ink(topic)]
        job_id: u32,
    }

    /// JobUpdated event
    /// This event is emitted when a job is updated successfully
    /// The event contains the creator of the job and the job id and enum of the job status
    #[ink(event)]
    pub struct JobUpdated {
        /// The creator of the job
        #[ink(topic)]
        creator: AccountId,

        /// The job id
        #[ink(topic)]
        job_id: u32,

        /// The status of the job
        #[ink(topic)]
        status: JobStatus,
    }

    /// JobCompleted event
    /// This event is emitted when a job is completed successfully
    /// The event contains the creator of the job and the job id
    /// The job id is the index of the job in the jobs storage
    /// The event also contains the cid of the result data of the job
    #[ink(event)]
    pub struct JobCompleted {
        /// The creator of the job
        #[ink(topic)]
        creator: AccountId,

        /// The job id
        #[ink(topic)]
        job_id: u32,

        /// Task id
        #[ink(topic)]
        task_id: u32,
    }

    /// TaskClaimed event
    /// This event is emitted when a task is claimed successfully
    /// The event contains the account id of the worker and the task id
    #[ink(event)]
    pub struct TaskClaimed {
        /// The account id of the worker
        #[ink(topic)]
        worker: AccountId,

        /// The task id
        /// The task id is the index of the task in the tasks storage
        #[ink(topic)]
        task_id: u32,
    }

    /// TaskFailed event
    /// This event is emitted when a task fails
    /// The event contains the account id of the worker and the task id
    #[ink(event)]
    pub struct TaskFailed {
        /// The account id of the worker
        /// The worker is the account id of the worker that failed the task
        #[ink(topic)]
        worker: AccountId,

        /// The task id
        #[ink(topic)]
        task_id: u32,
    }
    //-- End of Events

    //-- Storage
    /// Enumeration of valid job states.
    #[derive(Clone, Copy, PartialEq, Eq, Debug)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub enum JobStatus {
        /// Job has been created and awaiting processing.
        Created,

        /// Job is currently in progress.
        InProgress,

        /// Job has failed. No further processing will be attempted.
        Failed,

        /// Job has been completed successfully.
        Completed,
    }

    #[cfg_attr(
        feature = "std",
        derive(Debug, PartialEq, ink::storage::traits::StorageLayout)
    )]
    #[derive(Clone)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub struct Task {
        /// The task ID
        id: u32,

        /// The worker account id
        worker: Option<AccountId>,

        /// The status of the task
        status: JobStatus,

        /// The number of retries for the task
        retries: u32,

        /// The timestamp when the task was created
        created_at: Timestamp,

        /// The timestamp when the task was last updated
        updated_at: Option<Timestamp>,

        /// The timestamp when the task was completed
        completed_at: Option<Timestamp>,
    }

    impl Task {
        pub fn new(worker: AccountId) -> Self {
            Self {
                id: 0,
                worker: Some(worker),
                status: JobStatus::InProgress,
                retries: 0,
                created_at: block_timestamp::<DefaultEnvironment>(),
                updated_at: None,
                completed_at: None,
            }
        }

        pub fn default() -> Self {
            Self {
                id: 0,
                worker: None,
                status: JobStatus::Created,
                retries: 0,
                created_at: block_timestamp::<DefaultEnvironment>(),
                updated_at: None,
                completed_at: None,
            }
        }
    }

    #[cfg_attr(
        feature = "std",
        derive(Debug, PartialEq, ink::storage::traits::StorageLayout)
    )]
    #[derive(Clone)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub struct Job {
        /// The account id of the creator of the job
        creator: AccountId,

        /// The content id of the manifest for the job
        /// The manifest contains the instructions for the job
        cid_manifest: String,

        /// The content id of the result manifest for the job
        cid_results: Option<Vec<String>>,

        /// The tip for the worker
        /// The tip is the total amount tipped to the worker(s) for completing the job
        tip: Option<Balance>,

        /// List of tasks within the job
        tasks: Vec<Task>,

        /// The timestamp when the job was created
        /// The timestamp is the block number when the job was created
        created_at: Timestamp,

        /// The timestamp when the job was last updated
        /// The timestamp is the block number when the job was last updated
        updated_at: Option<Timestamp>,

        /// The timestamp when the job was completed
        /// The timestamp is the block number when the job was completed
        completed_at: Option<Timestamp>,
    }

    impl Job {
        pub fn new(creator: AccountId, cid_manifest: String, task_count: u32) -> Self {
            let tasks = vec![Task::default(); task_count as usize];
            let blocktimestamp = block_timestamp::<DefaultEnvironment>();

            Self {
                creator,
                cid_manifest,
                cid_results: None,
                tip: None,
                tasks,
                created_at: blocktimestamp,
                updated_at: Some(blocktimestamp),
                completed_at: None,
            }
        }

        pub fn default() -> Self {
            let blocktimestamp = block_timestamp::<DefaultEnvironment>();

            Self {
                creator: account_id::<ink::env::DefaultEnvironment>(),
                cid_manifest: Default::default(),
                cid_results: None,
                tip: None,
                tasks: Default::default(),
                created_at: blocktimestamp,
                updated_at: Some(blocktimestamp),
                completed_at: None,
            }
        }

        pub fn get_job_status(&self) -> JobStatus {
            // If no tasks, return Failed
            // Should "never" happen
            if self.tasks.is_empty() {
                return JobStatus::Failed;
            }

            // Aggregate task status to determine job status
            // If any task is failed, job is failed
            // If any task is in progress and none failed, job is in progress
            // If all tasks are completed, job is completed
            // If all tasks are created, job is created
            let mut has_in_progress = false;
            let mut has_created = false;

            for task in self.tasks.iter() {
                if task.status == JobStatus::Failed {
                    return JobStatus::Failed;
                } else if task.status == JobStatus::InProgress {
                    has_in_progress = true;
                } else if task.status == JobStatus::Created {
                    has_created = true;
                }
            }

            if has_in_progress {
                JobStatus::InProgress
            } else if has_created {
                JobStatus::Created
            } else {
                JobStatus::Completed
            }
        }

        /// Claim a task
        /// If job has available tasks, claim the first available task
        /// Returns an error if no tasks are available
        pub fn claim_task(&mut self, worker: AccountId) -> Result<Task, Error> {
            // Claim first "Created" task
            for task in self.tasks.iter_mut() {
                if task.status == JobStatus::Created {
                    task.worker = Some(worker);
                    task.status = JobStatus::InProgress;
                    task.updated_at = Some(block_timestamp::<DefaultEnvironment>());
                    return Ok(task.clone());
                }
            }

            Err(Error::ClaimFailed)
        }

        /// Scan active tasks for account if, returns True if account id is found
        pub fn has_worker(&self, worker: AccountId, task_status: Option<JobStatus>) -> bool {
            let task_status = task_status.unwrap_or(JobStatus::InProgress);

            for task in self.tasks.iter().filter(|task| task.status == task_status) {
                if let Some(worker_id) = task.worker {
                    if worker_id == worker {
                        return true;
                    }
                }
            }

            false
        }
    }

    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    pub struct NocturneJob {
        /// Store listing of all active jobs
        jobs: StorageVec<Job>,

        /// Max retries for a task
        max_retries: u32,

        /// Max tasks a job may have
        max_tasks: u32,
    }
    //-- End of Storage

    impl NocturneJob {
        /// Constructor that initializes jobs from externally provided StorageVec.
        #[ink(constructor)]
        pub fn new(max_retries: u32, max_tasks: u32) -> Self {
            let jobs: StorageVec<Job, _> = StorageVec::new();

            if max_retries == 0 || max_tasks == 0 {
                panic!("Max retries and max tasks must be greater than 0");
            }

            Self {
                jobs,
                max_retries,
                max_tasks,
            }
        }

        /// The default constructor
        #[ink(constructor, default)]
        pub fn default() -> Self {
            Self {
                jobs: Default::default(),
                max_retries: 3,
                max_tasks: 15,
            }
        }

        /// Submit a new job (UI endpoint)
        /// The job is created and added to the jobs storage
        /// The job is created with the creator account id, the data content id and the manifest content id
        /// The job is created with the status Created
        /// The job is created with the created_at timestamp
        /// Submit is a payable function, the caller may attach a deposit to the call. Deposit is a 'tip' for the worker
        #[ink(message, payable)]
        pub fn submit(&mut self, cid_manifest: String, task_count: u32) -> Result<(), Error> {
            let creator = self.env().caller();

            if task_count == 0 || task_count > 10 {
                return Err(Error::SubmitFailed);
            }

            // Tip is None if 0 value is transferred else the value transferred
            let transfered_value = self.env().transferred_value();
            let tip = if transfered_value == 0 {
                None
            } else {
                Some(transfered_value)
            };

            let tasks = vec![Task::default(); task_count as usize];

            let job = Job {
                creator: self.env().caller(),
                cid_manifest,
                cid_results: None,
                tip,
                tasks,
                created_at: self.env().block_timestamp(),
                updated_at: None,
                completed_at: None,
            };

            self.jobs
                .try_push::<Job>(&job)
                .map_err(|_| Error::SubmitFailed)?;

            let job_id = self.jobs.len().checked_sub(1).ok_or(Error::SubmitFailed)?;
            self.env().emit_event(JobSubmitted { creator, job_id });

            Ok(())
        }

        /// Claim a job (Backend endpoint)
        /// The job is updated with the status Pending
        /// The job is updated with the updated_at timestamp
        /// The job is updated with the worker account id
        #[ink(message)]
        pub fn claim(&mut self, job_id: u32) -> Result<Job, Error> {
            let caller = self.env().caller();

            // If caller is already working a task in any job, return error
            if let Some(jobs) = self.get_jobs_by_worker(Some(JobStatus::InProgress)) {
                if !jobs.is_empty() {
                    return Err(Error::CallerBusy);
                }
            }

            // If job has available tasks, claim the first available task
            let mut job = self.jobs.get(job_id).ok_or(Error::ClaimFailed)?;
            let task = job.claim_task(caller).map_err(|_| Error::ClaimFailed)?;

            job.updated_at = self.env().block_timestamp().into();

            // Update job with the updated task
            self.jobs.set(job_id, &job).unwrap();

            self.env().emit_event(TaskClaimed {
                worker: caller,
                task_id: task.id,
            });

            Ok(job.clone())
        }

        /// Claim first available job (Backend endpoint)
        /// Scan jobs for most recent available job
        /// Calls claim with the job id
        /// Returns an error if no job is available
        #[ink(message)]
        pub fn claim_first(&mut self) -> Result<Job, Error> {
            // If caller is already working a task in any job, return error
            if let Some(jobs) = self.get_jobs_by_worker(Some(JobStatus::InProgress)) {
                if !jobs.is_empty() {
                    return Err(Error::CallerBusy);
                }
            }

            let job_count = self.jobs.len();
            for i in 0..job_count {
                if let Ok(job) = self.jobs.try_get(i).ok_or(Error::NoJobs)? {
                    if job.get_job_status() == JobStatus::Created
                        || job.get_job_status() == JobStatus::InProgress
                    {
                        return self.claim(i);
                    }
                }
            }

            Err(Error::NoJobs)
        }

        /// Fail a job (Backend endpoint)
        /// The job is updated with the status Failed
        /// The job is updated with the updated_at timestamp
        /// The worker account id is removed from the job workers
        #[ink(message)]
        pub fn fail(&mut self, job_id: u32, task_id: u32) -> Result<(), Error> {
            let caller = self.env().caller();
            let mut job = self.jobs.get(job_id).ok_or(Error::UpdateFailed)?;
            let task = job
                .tasks
                .get_mut(task_id as usize)
                .ok_or(Error::UpdateFailed)?;

            // If task not owned by caller, return error
            if task.worker != Some(caller) {
                return Err(Error::NotWorker);
            }

            // If task not in valid in progress state, return error
            if task.status != JobStatus::InProgress {
                return Err(Error::UpdateFailed);
            }

            // Update task and job
            task.retries.checked_add(1).ok_or(Error::UpdateFailed)?;

            // Update job
            job.updated_at = self.env().block_timestamp().into();
            if task.retries >= self.max_retries {
                job.completed_at = self.env().block_timestamp().into();
                task.status = JobStatus::Failed;
            } else {
                task.worker = None;
                task.status = JobStatus::Created;
            }

            // Update job with the updated task
            self.jobs.set(job_id, &job).unwrap();

            // Emit TaskFailed event
            self.env().emit_event(TaskFailed {
                worker: caller,
                task_id,
            });

            Ok(())
        }

        /// Complete a job task (Backend endpoint)
        /// The job is updated with the status Completed
        /// The job is updated with the updated_at timestamp
        /// The job is updated with the result content id
        #[ink(message)]
        pub fn complete(
            &mut self,
            job_id: u32,
            task_id: u32,
            cid_result: String,
        ) -> Result<(), Error> {
            let caller = self.env().caller();
            let mut job = self.jobs.get(job_id).ok_or(Error::UpdateFailed)?;
            let task = job
                .tasks
                .get_mut(task_id as usize)
                .ok_or(Error::UpdateFailed)?;

            // If task not owned by caller, return error
            if task.worker != Some(caller) {
                return Err(Error::NotWorker);
            }

            // If task not in valid in progress state, return error
            if task.status != JobStatus::InProgress {
                return Err(Error::UpdateFailed);
            }

            // Update task status
            task.status = JobStatus::Completed;

            // Update job completed_at timestamp if all tasks are completed
            let completed_task_count = job
                .tasks
                .iter()
                .filter(|task| task.status == JobStatus::Completed)
                .count();
            if completed_task_count == job.tasks.len() {
                job.completed_at = self.env().block_timestamp().into();
            }

            // Update job with result content id
            job.updated_at = self.env().block_timestamp().into();
            job.cid_results = Some(vec![cid_result.clone()]);

            // Update job with the updated task
            self.jobs.set(job_id, &job).unwrap();

            // Emit JobCompleted event
            self.env().emit_event(JobCompleted {
                creator: caller,
                job_id,
                task_id,
            });

            Ok(())
        }

        /// Cancel entire job (UI endpoint)
        /// Owner of the job can cancel the job
        #[ink(message)]
        pub fn cancel(&mut self, job_id: u32) -> Result<(), Error> {
            let caller = self.env().caller();
            let mut job = self.jobs.get(job_id).ok_or(Error::NoJobs)?;

            // If caller is not the owner of the job, return error
            if job.creator != caller {
                return Err(Error::NotOwner);
            }

            // Set all tasks to failed
            for task in job.tasks.iter_mut() {
                task.status = JobStatus::Failed;
            }

            // Update job with the status Failed
            job.updated_at = self.env().block_timestamp().into();

            // Update job with the updated task
            self.jobs.set(job_id, &job).unwrap();

            Ok(())
        }

        /// Fetch Job by ID (General purpose endpoint)
        /// Returns the job with the job id
        /// Returns None if the job id is not found
        #[ink(message)]
        pub fn get_job(&self, job_id: u32) -> Result<Option<Job>, Error> {
            Ok(self.jobs.get(job_id))
        }

        /// Fetch all Jobs
        /// Returns a list of all jobs
        /// Returns None if there are no jobs
        #[ink(message)]
        pub fn get_jobs(&self) -> Option<Vec<Job>> {
            let job_count = self.jobs.len();
            if job_count == 0 {
                None
            } else {
                let mut job_listing: Vec<Job> = Vec::new();
                for i in 0..job_count {
                    if let Some(job) = self.jobs.get(i) {
                        job_listing.push(job);
                    }
                }
                Some(job_listing)
            }
        }

        /// Fetch all Jobs by Creator (General purpose endpoint)
        /// Returns a list of all jobs created by the caller
        /// Filter by job status if provided
        /// Returns None if there are no jobs created by the caller
        #[ink(message)]
        pub fn get_jobs_by_creator(&self, job_status: Option<JobStatus>) -> Option<Vec<Job>> {
            let caller = self.env().caller();
            let job_count = self.jobs.len();
            if job_count == 0 {
                None
            } else {
                let mut job_listing: Vec<Job> = Vec::new();
                for i in 0..job_count {
                    if let Ok(job) = self.jobs.try_get(i)? {
                        if job.creator == caller {
                            if let Some(status) = job_status {
                                if job.get_job_status() == status {
                                    job_listing.push(job.clone());
                                }
                            } else {
                                job_listing.push(job.clone());
                            }
                        }
                    }
                }
                Some(job_listing)
            }
        }

        /// Fetch all Jobs by Worker (General purpose endpoint)
        /// Returns a list of all jobs with tasks claimed by the caller
        /// Filter by job status if provided
        /// Returns None if there are no jobs claimed by the caller
        #[ink(message)]
        pub fn get_jobs_by_worker(&self, job_status: Option<JobStatus>) -> Option<Vec<Job>> {
            let caller = self.env().caller();

            let mut job_listing: Vec<Job> = Vec::new();
            for i in 0..self.jobs.len() {
                if let Ok(job) = self.jobs.try_get(i)? {
                    if job.has_worker(caller, job_status) {
                        job_listing.push(job.clone());
                    }
                }
            }

            Some(job_listing)
        }
    }

    /// Unit tests in Rust are normally defined within such a `#[cfg(test)]`
    /// module and test functions are marked with a `#[test]` attribute.
    /// The below code is technically just normal Rust code.
    #[cfg(test)]
    mod tests {
        use super::*;

        /// We test if the default constructor does its job.
        #[ink::test]
        fn deploy_contact_default() {
            let contract = NocturneJob::default();
            assert_eq!(contract.max_retries, 3);
            assert_eq!(contract.max_tasks, 15);
            assert_eq!(contract.jobs.len(), 0);
        }

        /// Test Job status transitions and reporting
        #[ink::test]
        fn job_status() {
            let mut job = Job::new(account_id::<DefaultEnvironment>(), "cid".to_string(), 3);

            // Job is created
            assert_eq!(
                job.get_job_status(),
                JobStatus::Created,
                "Job is created if all tasks are created ({:?}|{:?}|{:?})",
                job.tasks[0].status,
                job.tasks[1].status,
                job.tasks[2].status
            );

            // Job is in progress
            job.tasks[0].status = JobStatus::InProgress;
            job.tasks[1].status = JobStatus::Created;
            job.tasks[2].status = JobStatus::Completed;
            assert_eq!(
                job.get_job_status(),
                JobStatus::InProgress,
                "Job is in progress if any task is in progress ({:?}|{:?}|{:?})",
                job.tasks[0].status,
                job.tasks[1].status,
                job.tasks[2].status
            );

            // Job is failed due to task failure
            job.tasks[0].status = JobStatus::Failed;
            job.tasks[1].status = JobStatus::InProgress;
            job.tasks[2].status = JobStatus::Created;
            assert_eq!(
                job.get_job_status(),
                JobStatus::Failed,
                "Job is failed if any task is failed ({:?}|{:?}|{:?})",
                job.tasks[0].status,
                job.tasks[1].status,
                job.tasks[2].status
            );

            // Job is completed
            job.tasks[0].status = JobStatus::Completed;
            job.tasks[1].status = JobStatus::Completed;
            job.tasks[2].status = JobStatus::Completed;
            assert_eq!(
                job.get_job_status(),
                JobStatus::Completed,
                "Job is completed if all tasks are completed ({:?}|{:?}|{:?})",
                job.tasks[0].status,
                job.tasks[1].status,
                job.tasks[2].status
            );
        }
    }

    #[cfg(all(test, feature = "e2e-tests"))]
    mod e2e_tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /// A helper function used for calling contract messages.
        use ink_e2e::ContractsBackend;

        /// The End-to-End test `Result` type.
        type E2EResult<T> = std::result::Result<T, Box<dyn std::error::Error>>;

        /// We test that we can upload and instantiate the contract using its default constructor.
        #[ink_e2e::test]
        async fn default_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            // Given
            let mut constructor = NocturneJobRef::default();

            // When
            let contract = client
                .instantiate("nocturne_job", &ink_e2e::alice(), &mut constructor)
                .submit()
                .await
                .expect("instantiate failed");
            let mut _call_builder = contract.call_builder::<NocturneJob>();

            // Then

            Ok(())
        }

        /// Test that we can submit a job to a deployed contract
        #[ink_e2e::test]
        async fn submit_job(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            // Given
            let mut constructor = NocturneJobRef::default();
            let manifest_cid = "QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB".to_string();
            let task_count = 3;

            // When
            let contract = client
                .instantiate("nocturne_job", &ink_e2e::alice(), &mut constructor)
                .submit()
                .await
                .expect("instantiate failed");
            let mut call_builder = contract.call_builder::<NocturneJob>();

            // Then
            let submit = call_builder.submit(manifest_cid.clone(), task_count);
            let submit_result = client.call(&ink_e2e::bob(), &submit).dry_run().await?;
            assert!(matches!(submit_result.return_value(), Ok(())));

            let jobs = call_builder.get_jobs();
            let jobs_result = client.call(&ink_e2e::bob(), &jobs).dry_run().await?;

            if let Some(jobs) = jobs_result.return_value() {
                assert_eq!(jobs.len(), 1);
            } else {
                assert!(false);
            }

            Ok(())
        }
    }