export type options = {
  label: string;
  value: string;
};

export const jobTypes: options[] = [
  { label: "Docker", value: "docker" },
  { label: "K8s", value: "k8s" },
  { label: "Petals", value: "petals" },
];

export const dockerImages: options[] = [
  { label: "Training Image", value: "immu-ai/training:latest" },
  { label: "Bias Detection Image", value: "immu-ai/bias-detection:latest" },
  { label: "Petals Image", value: "immu-ai/petals:latest" },
];

export const CONTRACT_ADDRESS =
  "0x33fb744c44cddf9f5833be88e59c30852ef7f3cadbda428dc09b220b6c3a19eb";
