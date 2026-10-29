'use client';

import { workflowService } from '@/lib/approval-workflow';
import ApprovalProgress from './ApprovalProgress';
import { useDemoRole } from './DemoRole';
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Download, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Business, UploadedDocument } from '@/app/(dashboard)/dashboard/types/virtual-accounts';
import { REQUIRED_DOCUMENTS } from '@/app/(dashboard)/dashboard/queries/virtual-accounts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Fields,
  DATA_KEY,
  DataState,
  PageHeading,
  State,
  StatusBadge,
  date,
  useDashboard
} from './shared';

export default function DocumentReview({
  merchantId,
  businessId,
  submissionId
}: {
  merchantId: string;
  businessId: string;
  submissionId?: string;
}) {
  const query = useDashboard();
  const role = useDemoRole();
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<'Approved' | 'Declined' | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [preview, setPreview] = useState<UploadedDocument | null>(null);
  const [previewState, setPreviewState] = useState<'loading' | 'ready' | 'error'>('ready');
  const previewRequest = useRef(0);
  const merchant = query.data?.merchants.find((merchant) => merchant.id === merchantId);

  const selected = merchant?.businesses.find((business) => business.id === businessId);

  const cycle = selected ? workflowService.current(merchantId, selected) : undefined;
  const submission = submissionId
    ? workflowService.all().find((s) => s.id === submissionId)
    : cycle;
  const canReview = submission?.id === cycle?.id && submission?.stage === role;
  async function openPreview(document: UploadedDocument) {
    const request = ++previewRequest.current;
    setPreview(document);
    setPreviewState('loading');
    try {
      const response = await fetch(document.url);
      if (!response.ok) throw new Error('Unable to load document.');
      if (request === previewRequest.current) setPreviewState('ready');
    } catch {
      if (request === previewRequest.current) setPreviewState('error');
    }
  }

  async function submit() {
    if (!selected || !decision || submitting.current) return;
    if (decision === 'Declined' && !reason.trim()) {
      setError('Enter a reason for declining verification.');
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      if (!submission) throw new Error('Submission not found.');
      workflowService.decide(
        submission.id,
        role,
        decision === 'Declined' ? 'Rejected' : 'Approved',
        reason
      );
      await queryClient.invalidateQueries({ queryKey: DATA_KEY });
      toast.success(`${selected.name}: ${role} review recorded.`);
      setDecision(null);
      setReason('');
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Could not save the decision. Please retry.';
      setError(message);
      toast.error(message);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  function missingDocuments(business: Business) {
    return REQUIRED_DOCUMENTS.filter(
      (label) => !business.documents.some((document) => document.label === label)
    );
  }

  if (!query.data) return <DataState query={query} />;
  const back = { href: '/dashboard/approvals', label: 'Back to Approvals' };
  if (!selected)
    return (
      <div className="space-y-4">
        <PageHeading title="Business not found" back={back} />
        <State title="This business is unavailable for this merchant." />
      </div>
    );
  const missing = missingDocuments(selected);
  return (
    <div className="space-y-6">
      <PageHeading
        title={selected.name + ' — Document review'}
        description="Review the uploaded documents for this business before making a verification decision."
        back={back}
      />
      <Card className="space-y-6 p-5 shadow-none">
        {selected && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Merchant: {merchant?.name}</p>
                {submission && <ApprovalProgress submission={submission} />}
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/dashboard/merchants/${merchantId}?business=${selected.id}`}>
                  View merchant profile
                </Link>
              </Button>
            </div>
            <Fields
              entries={[
                ['Merchant email', merchant?.email],
                ['Business email', selected.email],
                ['RC number', selected.rcNumber],
                ['Tax ID', selected.taxId],
                ['Address', selected.address]
              ]}
            />
            {selected.verification.reviewedAt && (
              <p className="text-sm text-gray-500">
                Reviewed {date(selected.verification.reviewedAt, true)}
              </p>
            )}
            {selected.verification.reason && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h3 className="text-sm font-semibold">Reason for decline</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                  {selected.verification.reason}
                </p>
              </div>
            )}
            {[{ ...selected, documents: submission?.documents || selected.documents }].map(
              (business) => (
                <section key={business.id} className="space-y-3">
                  <h3 className="font-semibold">{business.name}</h3>
                  <div className="grid gap-3 md:grid-cols-3">
                    {REQUIRED_DOCUMENTS.map((label) => {
                      const document = business.documents.find((item) => item.label === label);
                      return (
                        <div key={label} className="min-w-0 rounded-lg border p-4">
                          <h4 className="flex items-center gap-2 text-sm font-medium">
                            <FileText size={16} />
                            {label}
                          </h4>
                          {document ? (
                            <>
                              <p className="mt-2 break-all text-xs text-gray-700">
                                {document.filename}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Uploaded {date(document.uploadedAt, true)}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    void openPreview(document);
                                  }}
                                >
                                  <Eye />
                                  Preview
                                </Button>
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={document.url} download={document.filename}>
                                    <Download />
                                    Download
                                  </a>
                                </Button>
                              </div>
                            </>
                          ) : (
                            <p className="mt-2 text-xs text-red-600">Not uploaded</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )
            )}
            {canReview && (
              <>
                {missing.length > 0 && (
                  <p className="text-sm text-orange-700">
                    Approval requires all documents. Missing: {missing.join('; ')}.
                  </p>
                )}
                <div className="flex flex-wrap justify-end gap-3">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDecision('Declined');
                      setError('');
                    }}
                  >
                    Reject submission
                  </Button>
                  <Button
                    disabled={missing.length > 0}
                    onClick={() => {
                      setDecision('Approved');
                      setError('');
                    }}
                  >
                    Approve submission
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </Card>
      {!canReview && submission && (
        <p className="text-sm text-gray-500">
          {submission.stage === 'Approved' || submission.stage === 'Rejected'
            ? 'This approval cycle is closed.'
            : 'Awaiting ' + submission.stage + ' review.'}
        </p>
      )}
      <Card className="space-y-4 p-5 shadow-none">
        <h2 className="font-semibold">Review history</h2>
        {(submissionId
          ? [submission].filter(Boolean)
          : workflowService.history(merchantId, businessId)
        ).map(
          (cycle) =>
            cycle && (
              <section key={cycle.id} className="space-y-3">
                <p className="text-xs text-gray-500">
                  Cycle submitted {date(cycle.submittedAt, true)}
                </p>
                {cycle.reviews.length ? (
                  cycle.reviews.map((review, i) => (
                    <div key={i} className="rounded border p-3 text-sm">
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="font-medium">
                          {review.reviewer} ? {review.role}
                        </p>
                        <StatusBadge status={review.decision} />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{date(review.timestamp, true)}</p>
                      <p className="mt-2 whitespace-pre-wrap break-words">
                        {review.comment || 'No comment provided.'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No decisions yet.</p>
                )}
              </section>
            )
        )}
      </Card>
      <Dialog
        open={!!decision}
        onOpenChange={(open) => {
          if (!open && !busy) setDecision(null);
        }}
      >
        <DialogContent
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {decision === 'Approved' ? 'Approve' : 'Reject'} {role} review?
            </DialogTitle>
            <DialogDescription>
              {decision === 'Approved'
                ? `Confirm that the documents for ${selected?.name} have been reviewed and accepted.`
                : `Explain why ${selected?.name}'s verification is declined. This reason will be saved with the business's verification record.`}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            {
              <div className="space-y-2">
                <label htmlFor="decline-reason" className="text-sm font-medium">
                  {decision === 'Declined' ? 'Rejection reason (required)' : 'Comment (optional)'}
                </label>
                <Textarea
                  id="decline-reason"
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setError('');
                  }}
                  placeholder="Explain what is wrong with the documents and what the merchant needs to correct."
                  required={decision === 'Declined'}
                  maxLength={1000}
                  disabled={busy}
                  aria-describedby={error ? 'verification-error' : undefined}
                />
                <p className="text-xs text-gray-500">{reason.length} / 1,000 characters</p>
              </div>
            }
            {error && (
              <p id="verification-error" role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setDecision(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={decision === 'Declined' ? 'destructive' : 'default'}
                disabled={busy || (decision === 'Declined' && !reason.trim())}
              >
                {busy
                  ? 'Saving…'
                  : decision === 'Approved'
                    ? 'Approve submission'
                    : 'Reject submission'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) {
            ++previewRequest.current;
            setPreview(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{preview?.label}</DialogTitle>
            <DialogDescription>{preview?.filename}</DialogDescription>
          </DialogHeader>
          {previewState === 'loading' ? (
            <State title="Loading document…" loading />
          ) : previewState === 'error' ? (
            <State
              title="The document could not be loaded."
              retry={() => {
                if (preview) void openPreview(preview);
              }}
            />
          ) : (
            preview &&
            (preview.type === 'application/pdf' ? (
              <iframe
                title={`${preview.label} preview`}
                src={preview.url}
                className="h-[60vh] w-full rounded border"
              />
            ) : (
              <img
                src={preview.url}
                alt={`${preview.label} preview`}
                className="max-h-[60vh] w-full object-contain"
              />
            ))
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
