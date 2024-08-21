import { SubmitJobForm } from "@/components/web3";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100dvh_-_96px)] items-center justify-center">
      <div className="w-3/4  p-6 gap-4 flex flex-col">
        <SubmitJobForm />
      </div>
    </main>
  );
}