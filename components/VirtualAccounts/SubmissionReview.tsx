'use client';
import { workflowService } from '@/lib/approval-workflow';
import DocumentReview from './DocumentReview';
import { DataState, State, useDashboard } from './shared';
export default function SubmissionReview({ submissionId }: { submissionId: string }) {
  const query = useDashboard();
  if (!query.data) return <DataState query={query} />;
  const s = workflowService.all().find((s) => s.id === submissionId);
  return s ? (
    <DocumentReview merchantId={s.merchantId} businessId={s.businessId} submissionId={s.id} />
  ) : (
    <State title="Submission not found" />
  );
}
