'use client';
import { approvalStatus, ROLES, stepStatus, Submission } from '@/lib/approval-workflow';
import { StatusBadge } from './shared';
export default function ApprovalProgress({ submission }: { submission: Submission }) {
  return (
    <div className="space-y-3">
      <StatusBadge status={approvalStatus(submission)} />
      <ol className="grid gap-3 sm:grid-cols-3">
        {ROLES.map((role, i) => (
          <li key={role} className="rounded-lg border bg-gray-50 p-3">
            <p className="mb-2 text-sm font-medium">
              {i + 1}. {role} review
            </p>
            <StatusBadge status={stepStatus(submission, role)} />
          </li>
        ))}
      </ol>
    </div>
  );
}
