import { AppProblemPage } from "@/components/AppProblemPage";

export default function ReportNotFound() {
  return (
    <AppProblemPage
      variant="embedded"
      kind="notFound"
      title="Report not found"
      description="This link may be invalid or the report may have been removed."
      primaryCta={{ href: "/", label: "Back to home" }}
    />
  );
}
