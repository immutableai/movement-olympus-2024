export default function ErrorMessage({ errorMsg }: { errorMsg?: string }) {
    return (
        <span className="text-destructive ">{errorMsg || ""}</span>
    )
}