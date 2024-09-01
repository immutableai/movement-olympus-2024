export enum JobError {
    SUBMIT_FAILED = 1,
    CLAIM_FAILED = 2,
    NO_JOBS = 3,
    UPDATE_FAILED = 4,
    NOT_OWNER = 5,
    NOT_WORKER = 6,
    CALLER_BUSY = 7
}

export enum JobStatus {
    CREATED = 11,
    IN_PROGRESS = 12,
    FAILED = 13,
    COMPLETED = 14
}



export interface Vec<T> {
    vec: T[];
}

export interface TaskType {
    id?: number;
    description?: string;
    status?: string;
}

export interface JobType {
    cid_manifest: string;
    cid_results: Vec<string>;
    completed_at: Vec<string>;
    created_at: string;
    creator: string;
    tasks: TaskType[];
    tip: Vec<string>;
    updated_at: Vec<string>;
}
