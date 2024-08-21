module nocturne_job_addr::job {
    use std::string::String;
    use std::option::{Self, Option};
    use std::timestamp;
    use std::vector;
    use std::signer;
    use aptos_framework::event; 

    // Errors
    const E_SUBMIT_FAILED: u64 = 1;
    const E_CLAIM_FAILED: u64 = 2;
    const E_NO_JOBS: u64 = 3;
    const E_UPDATE_FAILED: u64 = 4;
    const E_NOT_OWNER: u64 = 5;
    const E_NOT_WORKER: u64 = 6;
    const E_CALLER_BUSY: u64 = 7;

    // Job Status
    const CREATED: u8 = 11;
    const IN_PROGRESS: u8 = 12;
    const FAILED: u8 = 13; 
    const COMPLETED: u8 = 14;

    // This event is emitted when a new job is submitted successfully
    // The event contains the creator of the job and the job id
    // The job id is the index of the job in the jobs storage
    #[event]
    struct JobSubmitted has drop, store {
        creator: address,
        job_id: u64,
    }

    // This event is emitted when a job is updated successfully
    // The event contains the creator of the job and the job id and enum of the job status
    #[event]
    struct JobUpdated has drop, store {
        creator: address, 
        job_id: u64,
        status: u8, // JobStatus as u8
    }

    // This event is emitted when a job is completed successfully
    // The event contains the creator of the job and the job id
    // The job id is the index of the job in the jobs storage
    // The event also contains the cid of the result data of the job
    #[event]
    struct JobCompleted has drop, store {
        creator: address,
        job_id: u64,
        task_id: u64,
    }

    // This event is emitted when a task is claimed successfully
    // The event contains the account id of the worker and the task id
    #[event]
    struct TaskClaimed has drop, store {
        worker: address,
        task_id: u64,
    }

    // This event is emitted when a task fails
    // The event contains the account id of the worker and the task id
    #[event]
    struct TaskFailed has drop, store {
        worker: address,
        task_id: u64,
    }

    // NocturneJob Resource
    struct NocturneJob has key, store, copy, drop {
        jobs: vector<Job>,
        max_retries: u64,
        max_tasks: u64,
    }

    // Job Resource
    struct Job has key, store, copy, drop {
        // The address of the creator of the job
        creator: address,

        // The content id of the manifest for the job
        // The manifest contains the instructions for the job
        cid_manifest: String,

        // The content id of the result manifest for the job
        cid_results: Option<vector<String>>,

        // The tip for the worker
        // The tip is the total amount tipped to the worker(s) for completing the job
        tip: Option<u64>,

        // List of tasks within the job
        tasks: vector<Task>,

        // The timestamp when the job was created
        // The timestamp is the block number when the job was created
        created_at: u64,

        // The timestamp when the job was last updated
        // The timestamp is the block number when the job was last updated
        updated_at: Option<u64>,

        // The timestamp when the job was completed
        // The timestamp is the block number when the job was completed
        completed_at: Option<u64>,
    }

    // Task Resource
    struct Task has key, store, copy, drop {
        //Task ID
        id: u64,

        // The worker account address
        worker: Option<address>,

        // The status of the task
        status: u8,

        // The number of retries for the task
        retries: u64,

        // The timestamp when the task was created
        created_at: u64,

        // The timestamp when the task was last updated
        updated_at: Option<u64>,

        // The timestamp when the task was completed
        completed_at: Option<u64>,
    }

    #[view]
    public fun get_jobs(): vector<Job> acquires NocturneJob {
        let nocturne_job = borrow_global<NocturneJob>(@nocturne_job_addr);
        nocturne_job.jobs
    }

    #[view]
    public fun get_job_status(job_id: u64): u8 acquires NocturneJob { 
        let jobs = get_jobs_mut();
        let job = vector::borrow(&jobs, job_id);
        let tasks = job.tasks;

        // If no tasks, return Failed
        // Should "never" happen
        if(vector::is_empty(&tasks)) {
            return FAILED
        };

        // Aggregate task status to determine job status
        // If any task is failed, job is failed
        // If any task is in progress and none failed, job is in progress
        // If all tasks are completed, job is completed
        // If all tasks are created, job is created
        let has_in_progress = false;
        let has_created = false;

        for(i in 0..vector::length(&tasks)) {
            let task = vector::borrow(&tasks, i);
            if(task.status == FAILED) {
                return FAILED
            } else if(task.status == IN_PROGRESS) {
                has_in_progress = true;
            } else if(task.status == CREATED) {
                has_created = true;
            }
        };

        if(has_in_progress) { 
            IN_PROGRESS
        } else if(has_created) {
            CREATED
        } else {
            COMPLETED
        }
    } 

    // Fetch all Jobs by Creator (General purpose endpoint)
    // Returns a list of all jobs created by the caller
    // Filter by job status if provided
    // Returns None if there are no jobs created by the caller
    #[view]
    public fun get_jobs_by_creator(creator: address, job_status: Option<u8>): Option<vector<Job>> acquires NocturneJob {
        let jobs = get_jobs();
        let job_count = vector::length(&jobs);
        if(job_count == 0) {
            return option::none()
        };
        let job_listing = vector::empty<Job>();
        for(i in 0..job_count) {
            let job = vector::borrow(&jobs, i);
            if(job.creator == creator) {
                if(option::is_some(&job_status)) {
                    let status = option::borrow(&job_status);
                    if(get_job_status(i) == *status) {
                        vector::push_back(&mut job_listing, *job);
                    }
                } else {
                    vector::push_back(&mut job_listing, *job);
                };
            }
        };
        option::some(job_listing)
    }

    // Fetch all Jobs by Worker (General purpose endpoint)
    // Returns a list of all jobs with tasks claimed by the caller
    // Filter by job status if provided
    // Returns None if there are no jobs claimed by the caller
    #[view]
    public fun get_jobs_by_worker(worker: address, job_status: Option<u8>): Option<vector<Job>> acquires NocturneJob  {
        let jobs = get_jobs();
        let job_listing = vector::empty<Job>();

        for(i in 0..vector::length(&jobs)) {
            let job = vector::borrow(&jobs, i);
            if(has_worker(worker, job_status, i)){
                vector::push_back(&mut job_listing, *job);
            };
        };
        option::some(job_listing)
    }
    
    // Scan active tasks for account if, returns True if address is found
    #[view]
    public fun has_worker(worker: address, task_status: Option<u8>, job_id: u64): bool acquires NocturneJob {
        let status = option::get_with_default(&task_status, IN_PROGRESS);
        let jobs = get_jobs();
        let job = vector::borrow(&jobs, job_id);
        let tasks = job.tasks;
        for(i in 0..vector::length(&tasks)) {
            let task = vector::borrow(&tasks, i);
            if(task.status == status && task.worker == option::some(worker)) {
                return true
            }
        };
        false
    }

    // Initalize NocturneJob resource
    // TODO: Update max_retries and max_tasks
    fun init_module(nocturne_job_signer: &signer) { 
        let nocturne_job = NocturneJob {
            jobs: vector::empty<Job>(),
            max_retries: 3,
            max_tasks: 10,
        };
        move_to(nocturne_job_signer, nocturne_job);
    }

    // TODO: Task count is currently not used
    public fun new_job(caller: &signer, cid_manifest: String, task_count: u32, tip: Option<u64>): Job {
        Job { 
            creator: signer::address_of(caller),
            cid_manifest,
            cid_results: option::none(),
            tip,
            tasks: vector::empty<Task>(),
            created_at: timestamp::now_seconds(),
            updated_at: option::none(),
            completed_at: option::none(),
        }
    } 

    // Submit a new job (UI endpoint)
    // The job is created and added to the jobs storage
    // The job is created with the creator account address, the data content id and the manifest content id
    // The job is created with the status Created
    // The job is created with the created_at timestamp
    // The caller may attach a deposit to the call. Deposit is a 'tip' for the worker
    public entry fun submit(caller: &signer, cid_manifest: String, task_count: u32, tip: Option<u64>) acquires NocturneJob {
        assert!(task_count > 0 && task_count <= 10, E_SUBMIT_FAILED);
        let nocturne_job = borrow_global_mut<NocturneJob>(@nocturne_job_addr);
        let job = new_job(caller, cid_manifest, task_count, tip);
        vector::push_back(&mut nocturne_job.jobs, job);
        let job_id = vector::length(&nocturne_job.jobs) - 1;
        event::emit(JobSubmitted { 
            creator: signer::address_of(caller),
            job_id
        });
    }

    // Claim a job (Backend endpoint)
    // The job is updated with the status Pending
    // The job is updated with the updated_at timestamp
    // The job is updated with the worker account id
    public entry fun claim(caller: &signer, job_id: u64) acquires NocturneJob {
        let worker = signer::address_of(caller);
        let jobs = get_jobs_by_worker(worker, option::some(IN_PROGRESS));
        assert!(option::is_some(&jobs), E_NO_JOBS);
        let jobs = option::extract(&mut jobs);
        assert!(!vector::is_empty(&jobs), E_CALLER_BUSY);
        let job = vector::borrow_mut(&mut jobs, job_id);
        let task = claim_task(worker, job_id);
        job.updated_at = option::some(timestamp::now_seconds());
        event::emit(TaskClaimed { 
            worker,
            task_id: task.id,
        });
    }

    // Claim first available job (Backend endpoint)
    // Scan jobs for most recent available job
    // Calls claim with the job id
    // Returns an error if no job is available
    public entry fun claim_first(caller: &signer) acquires NocturneJob {
        let worker = signer::address_of(caller);
        let jobs = get_jobs_by_worker(worker, option::some(IN_PROGRESS));
        assert!(option::is_some(&jobs), E_NO_JOBS);
        let jobs = option::extract(&mut jobs);
        assert!(!vector::is_empty(&jobs), E_CALLER_BUSY);
        for(i in 0..vector::length(&jobs)) {
            let status = get_job_status(i);
            if(status == CREATED || status == IN_PROGRESS){
                claim(caller, i);
            }
        };
    }

    // Fail a job (Backend endpoint)
    // The job is updated with the status Failed
    // The job is updated with the updated_at timestamp
    // The worker account id is removed from the job workers
    public entry fun fail(caller: &signer, job_id: u64, task_id: u64) acquires NocturneJob {
        let nocturne_job = borrow_global_mut<NocturneJob>(@nocturne_job_addr);
        let jobs = nocturne_job.jobs;
        let job = vector::borrow_mut(&mut jobs, job_id);
        let task = vector::borrow_mut(&mut job.tasks, task_id);
        let worker = signer::address_of(caller);

        // If task not owned by caller, return error
        assert!(task.worker == option::some(worker), E_NOT_WORKER);

        // If task not in valid in progress state, return error
        assert!(task.status == IN_PROGRESS, E_UPDATE_FAILED);

        // Update task and job
        task.retries = task.retries + 1;

        // Update job
        job.updated_at = option::some(timestamp::now_seconds());
        if(task.retries > nocturne_job.max_retries) {
            job.completed_at = option::some(timestamp::now_seconds());
            task.status = FAILED;
        } else {
            task.worker = option::none();
            task.status = CREATED;
        };

        // Emit TaskFailed event
        event::emit(TaskFailed { 
            worker,
            task_id,
        });
    }

    // Complete a job task (Backend endpoint)
    // The job is updated with the status Completed
    // The job is updated with the updated_at timestamp
    // The job is updated with the result content id
    public entry fun complete(caller: &signer, job_id: u64, task_id: u64, cid_result: String) acquires NocturneJob {
        let jobs = get_jobs_mut();
        let job = vector::borrow_mut(&mut jobs, job_id);
        let task = vector::borrow_mut(&mut job.tasks, task_id);
        let creator = signer::address_of(caller);

        // If task not owned by caller, return error
        assert!(task.worker == option::some(creator), E_NOT_WORKER);

        // If task not in valid in progress state, return error
        assert!(task.status == IN_PROGRESS, E_UPDATE_FAILED);

        // Update task status
        task.status = COMPLETED;

        // Update job completed_at timestamp if all tasks are completed
        let completed_tasks = vector::empty<Task>();
        for(i in 0..vector::length(&job.tasks)) {
            let task = vector::borrow(&job.tasks, i);
            if(task.status == COMPLETED) {
                vector::push_back(&mut completed_tasks, *task);
            }
        };
        let completed_tasks_count = vector::length(&completed_tasks);

        if(completed_tasks_count == vector::length(&job.tasks)) {
            job.completed_at = option::some(timestamp::now_seconds());
        };

        // Update job with result content id
        job.updated_at = option::some(timestamp::now_seconds());
        job.cid_results = option::some(vector::singleton(cid_result));

        // Emit JobCompleted event
        event::emit(JobCompleted { 
            creator,
            job_id,
            task_id,
        });   
    }

    // Cancel entire job (UI endpoint)
    // Owner of the job can cancel the job
    public entry fun cancel(caller: &signer, job_id: u64) acquires NocturneJob {
        let jobs = get_jobs_mut();
        let job = vector::borrow_mut(&mut jobs, job_id);
        let creator = signer::address_of(caller);

        // If caller is not the owner of the job, return error
        assert!(job.creator == creator, E_NOT_OWNER);

        // Set all tasks to failed
        for(i in 0..vector::length(&job.tasks)) {
            let task = vector::borrow_mut(&mut job.tasks, i);
            task.status = FAILED;
        };

        // Update job with status failed
        job.updated_at = option::some(timestamp::now_seconds());
    }

    public fun new_task(worker: address): Task {
        Task {
            id: 0,
            worker: option::some(worker),
            status: CREATED,
            retries: 0,
            created_at: timestamp::now_seconds(),
            updated_at: option::none(),
            completed_at: option::none(),
        }
    }

    // Claim a task
    // If job has available tasks, claim the first available task
    // Returns an error if no tasks are available
    public fun claim_task(worker: address, job_id: u64): Task acquires NocturneJob { 
        // Claim first "Created" task
        let jobs = get_jobs_mut();
        let job = vector::borrow_mut(&mut jobs, job_id);
        for(i in 0..vector::length(&job.tasks)) {
            let task = vector::borrow_mut(&mut job.tasks, i);
            if(task.status == CREATED) {
                task.worker = option::some(worker);
                task.status = IN_PROGRESS;
                task.updated_at = option::some(timestamp::now_seconds());
                return *task
            }
        };
        abort(E_CLAIM_FAILED)
    }

    public inline fun get_jobs_mut(): vector<Job> acquires NocturneJob {
        let nocturne_job = borrow_global_mut<NocturneJob>(@nocturne_job_addr);
        nocturne_job.jobs
    }
}