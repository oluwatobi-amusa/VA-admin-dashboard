import SubmissionReview from '@/components/VirtualAccounts/SubmissionReview';
export default async function Page({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  return <SubmissionReview submissionId={submissionId} />;
}
