import z from "zod";

export const jobFormSchema = z.object({
  taskName: z.string().min(1, "Task name is required"),
  jobType: z.string().min(1, "Job type is required"),
  dockerImage: z.string().min(1, "Docker image is required"),
  wallet: z.string().min(1, "Wallet is required"),
  includeLogs: z.boolean().optional(),
});

export type JobFormData = z.infer<typeof jobFormSchema>;
