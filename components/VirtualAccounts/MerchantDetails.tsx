'use client';
import ApprovalProgress from './ApprovalProgress';
import { workflowService } from '@/lib/approval-workflow';
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Download, Eye, FileText, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import {
  Merchant,
  Till,
  UploadedDocument
} from '@/app/(dashboard)/dashboard/types/virtual-accounts';
import { virtualAccountsService } from '@/app/(dashboard)/dashboard/queries/virtual-accounts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  DATA_KEY,
  DataState,
  Fields,
  PageHeading,
  Pagination,
  PAGE_SIZE,
  RecordsTable,
  SearchInput,
  State,
  StatusBadge,
  date,
  money,
  useDashboard
} from './shared';

function TillAccounts({ merchant, tills }: { merchant: Merchant; tills: Till[] }) {
  const [search, setSearch] = useState('');
  const [business, setBusiness] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Till | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const queryClient = useQueryClient();
  const accounts = tills.filter((t) => t.merchantId === merchant.id);
  const filtered = accounts.filter(
    (t) =>
      `${t.name} ${t.number}`.toLowerCase().includes(search.trim().toLowerCase()) &&
      (!business || t.businessId === business)
  );
  async function disable() {
    if (!selected || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await virtualAccountsService.disableTill(selected.id);
      await queryClient.invalidateQueries({ queryKey: DATA_KEY });
      toast.success(`${selected.name} has been disabled.`);
      setSelected(null);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Could not disable this account. Please retry.';
      setError(message);
      toast.error(message);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <Card className="overflow-hidden shadow-none">
        <div className="flex flex-wrap gap-3 border-b p-4">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search account name or number"
          />
          <label className="flex flex-wrap items-center gap-3 text-sm font-medium">
            Business name
            <select
              aria-label="Filter till accounts by business"
              value={business}
              onChange={(event) => {
                setBusiness(event.target.value);
                setPage(1);
              }}
              className="rounded-md border bg-white px-3 py-2 text-sm font-normal"
            >
              <option value="">All businesses</option>
              {merchant.businesses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <RecordsTable
          columns={[
            'Account name',
            'Business name',
            'Account number',
            'Current balance',
            'Status',
            'Action'
          ]}
          empty={accounts.length ? undefined : 'No till accounts for this merchant.'}
          rows={filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((t) => [
            <span key="name" className="font-medium">
              {t.name}
            </span>,
            merchant.businesses.find((item) => item.id === t.businessId)?.name || 'Not provided',
            t.number,
            money(t.balance),
            <StatusBadge key="status" status={t.status} />,
            <DropdownMenu key="action">
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Actions for ${t.name}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={t.status === 'Disabled'}
                  onSelect={() => {
                    setSelected(t);
                    setError('');
                  }}
                >
                  Disable account
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/merchants/${merchant.id}/tills/${t.id}`}>
                    View transaction history
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ])}
        />
        <Pagination count={filtered.length} page={page} onChange={setPage} />
      </Card>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open && !busy) setSelected(null);
        }}
      >
        <DialogContent
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (busy) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Disable account?</DialogTitle>
            <DialogDescription>
              {selected?.name} ({selected?.number}) will be disabled and will no longer be available
              to receive payments.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => {
                void disable();
              }}
            >
              {busy ? 'Disabling…' : 'Disable account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function MerchantDetails({
  merchantId,
  initialTab = 'profile',
  initialBusinessId = ''
}: {
  merchantId: string;
  initialTab?: string;
  initialBusinessId?: string;
}) {
  const query = useDashboard();
  const queryClient = useQueryClient();
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const restoreSubmitting = useRef(false);
  const [businessId, setBusinessId] = useState(initialBusinessId);
  const [preview, setPreview] = useState<UploadedDocument | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [tab, setTab] = useState(initialTab);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const uploadSubmitting = useRef(false);
  if (!query.data) return <DataState query={query} />;
  const merchant = query.data.merchants.find((m) => m.id === merchantId);
  if (!merchant)
    return (
      <div className="space-y-4">
        <PageHeading
          title="Merchant not found"
          back={{ href: '/dashboard/merchants', label: 'Back to Merchants' }}
        />
        <State title="This merchant is unavailable." />
      </div>
    );
  const business = merchant.businesses.find((b) => b.id === businessId) || merchant.businesses[0];
  async function uploadDocument(file: File, label: string, selectedBusinessId: string) {
    if (!merchant || uploadSubmitting.current) return;
    setUploadError('');
    if (
      !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type) ||
      !file.size ||
      file.size > 2 * 1024 * 1024
    ) {
      setUploadError('Choose a PDF, PNG or JPEG document, up to 2 MB.');
      return;
    }
    uploadSubmitting.current = true;
    setUploading(true);
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('The document could not be read.'));
        reader.readAsDataURL(file);
      });
      await virtualAccountsService.uploadDocument(merchant.id, selectedBusinessId, {
        label,
        filename: file.name,
        type: file.type as UploadedDocument['type'],
        url,
        size: `${(file.size / 1024).toFixed(1)} KB`
      });
      await queryClient.invalidateQueries({ queryKey: DATA_KEY });
      toast.success('Document submitted. Business verification is pending review.');
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'The document could not be saved. Please retry.';
      setUploadError(message);
      toast.error(message);
    } finally {
      uploadSubmitting.current = false;
      setUploading(false);
    }
  }
  async function restore() {
    if (!merchant || restoreSubmitting.current) return;
    restoreSubmitting.current = true;
    setRestoring(true);
    setRestoreError('');
    try {
      await virtualAccountsService.restoreMerchant(merchant.id);
      await queryClient.invalidateQueries({ queryKey: DATA_KEY });
      toast.success(`${merchant.name} has been restored.`);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Could not restore this merchant. Please retry.';
      setRestoreError(message);
      toast.error(message);
    } finally {
      restoreSubmitting.current = false;
      setRestoring(false);
    }
  }
  async function openPreview(document: UploadedDocument) {
    setPreview(document);
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const response = await fetch(document.url);
      if (!response.ok) throw new Error('The document could not be loaded.');
    } catch {
      setPreviewError('The document could not be loaded. Please try again.');
    } finally {
      setPreviewLoading(false);
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Link
            href="/dashboard/merchants"
            className="inline-flex items-center gap-2 text-sm text-starter-primary hover:underline"
          >
            <ArrowLeft size={16} />
            Back to Merchants
          </Link>
          <div>
            <h1 className="text-[24px] font-bold text-gray-900">{merchant.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-gray-500">{merchant.email}</p>
              <StatusBadge status={merchant.status} />
            </div>
          </div>
        </div>
        {merchant.status === 'Suspended' && (
          <Button
            disabled={restoring}
            onClick={() => {
              void restore();
            }}
          >
            {restoring ? 'Restoring…' : 'Restore merchant'}
          </Button>
        )}
        </div>
      </div>
      {restoreError && (
        <p role="alert" className="text-sm text-red-600">
          {restoreError}
        </p>
      )}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 rounded-full">
          <TabsTrigger value="profile" className="rounded-full">
            Profile and Documents
          </TabsTrigger>
          <TabsTrigger value="tills" className="rounded-full">
            Till accounts
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-4">
          {merchant.businesses.length > 1 && (
            <div className="rounded-lg border bg-white p-4">
              <label className="flex flex-wrap items-center gap-3 text-sm font-medium">
                Business
                <select
                  aria-label="Select business"
                  value={business?.id || ''}
                  onChange={(e) => {
                    setBusinessId(e.target.value);
                    setPreview(null);
                  }}
                  className="rounded-md border bg-white px-3 py-2 text-sm font-normal"
                >
                  {merchant.businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {business && (
            <ApprovalProgress submission={workflowService.current(merchantId, business)} />
          )}
          {business && (
            <Button asChild variant="outline">
              <Link href={`/dashboard/document-verification/${merchantId}/${business.id}`}>
                Review submission
              </Link>
            </Button>
          )}
          <Accordion
            type="multiple"
            className="space-y-4"
          >
            <AccordionItem
              value="documents"
              className="rounded-[10px] border border-b-4 border-b-[rgba(196,196,196,0.24)] bg-white px-5"
            >
              <AccordionTrigger>Uploaded documents</AccordionTrigger>
              <AccordionContent>
                <p className="mb-3 text-xs text-gray-500">
                  Upload or replace documents to submit them for verification. PDF, PNG or JPEG, up
                  to 2 MB each.
                </p>
                {uploadError && (
                  <p role="alert" className="mb-3 text-sm text-red-600">
                    {uploadError}
                  </p>
                )}
                <div className="grid gap-3 xl:grid-cols-3">
                  {['CAC Doc', 'MEMART', 'Tax Document'].map((label) => {
                    const document = business?.documents.find((d) => d.label === label);
                    return (
                      <div key={label} className="rounded-lg border p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <FileText size={18} className="text-starter-primary" />
                          <h3 className="font-medium">{label}</h3>
                        </div>
                        {document ? (
                          <>
                            <p className="break-all text-xs text-gray-700">{document.filename}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {document.type === 'application/pdf' ? 'PDF' : 'Image'}
                              {document.size ? ` · ${document.size}` : ''}
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
                          <p className="text-xs text-gray-500">Not uploaded</p>
                        )}
                        {business && (
                          <div className="mt-3 space-y-1">
                            <label
                              htmlFor={`document-${business.id}-${label}`}
                              className="text-xs font-medium"
                            >
                              {document ? 'Replace document' : 'Upload document'}
                            </label>
                            <input
                              id={`document-${business.id}-${label}`}
                              type="file"
                              accept="application/pdf,image/png,image/jpeg"
                              disabled={uploading}
                              className="block w-full min-w-0 text-xs file:mr-2 file:rounded-md file:border file:bg-white file:px-2 file:py-1 file:text-xs"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = '';
                                if (file) void uploadDocument(file, label, business.id);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="personal"
              className="rounded-[10px] border border-b-4 border-b-[rgba(196,196,196,0.24)] bg-white px-5"
            >
              <AccordionTrigger>Personal information</AccordionTrigger>
              <AccordionContent>
                <Fields
                  entries={[
                    ['First name', merchant.firstName],
                    ['Last name', merchant.lastName],
                    ['Phone number', merchant.phone],
                    ['Email address', merchant.email],
                    ['BVN', merchant.bvnLastFour ? `•••••••${merchant.bvnLastFour}` : undefined]
                  ]}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="business"
              className="rounded-[10px] border border-b-4 border-b-[rgba(196,196,196,0.24)] bg-white px-5"
            >
              <AccordionTrigger>Business information</AccordionTrigger>
              <AccordionContent>
                {business ? (
                  <Fields
                    entries={[
                      ['Business name', business.name],
                      ['Registration type', business.registrationType],
                      ['RC number', business.rcNumber],
                      ['Tax ID', business.taxId],
                      [
                        'Registration date',
                        business.registrationDate ? date(business.registrationDate) : undefined
                      ],
                      ['Business email', business.email],
                      ['Business address', business.address]
                    ]}
                  />
                ) : (
                  <p className="text-gray-500">No business information available.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
        <TabsContent value="tills">
          <TillAccounts merchant={merchant} tills={query.data.tills} />
        </TabsContent>
      </Tabs>
      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{preview?.label}</DialogTitle>
            <DialogDescription>{preview?.filename} · Sample document</DialogDescription>
          </DialogHeader>
          {previewLoading ? (
            <State title="Loading document…" loading />
          ) : previewError ? (
            <State
              title={previewError}
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
          <DialogFooter>
            {preview && (
              <Button asChild variant="outline">
                <a href={preview.url} download={preview.filename}>
                  <Download />
                  Download
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
