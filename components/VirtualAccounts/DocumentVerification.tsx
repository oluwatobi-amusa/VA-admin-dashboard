'use client';
import { useState } from 'react';
import Link from 'next/link';
import { REQUIRED_DOCUMENTS } from '@/app/(dashboard)/dashboard/queries/virtual-accounts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DataState,
  FilterSelect,
  PageHeading,
  Pagination,
  PAGE_SIZE,
  RecordsTable,
  SearchInput,
  StatusBadge,
  SummaryCards,
  date,
  useDashboard
} from './shared';
export default function DocumentVerification() {
  const query = useDashboard();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Pending');
  const [page, setPage] = useState(1);
  if (!query.data) return <DataState query={query} />;
  const submissions = query.data.merchants.flatMap((merchant) =>
    merchant.businesses
      .filter((business) => business.documents.length)
      .map((business) => ({ merchant, business }))
  );
  const filtered = submissions
    .filter(
      ({ merchant, business }) =>
        (status === 'All' || business.verification.status === status) &&
        `${merchant.name} ${merchant.email} ${business.name}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())
    )
    .sort(
      (a, b) =>
        Date.parse(b.business.verification.submittedAt) -
        Date.parse(a.business.verification.submittedAt)
    );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));

  return (
    <div className="space-y-6">
      <PageHeading
        title="Document Verification"
        description="Review each business’s uploaded documents and approve or decline its verification."
      />
      <SummaryCards
        items={(['Pending', 'Approved', 'Declined'] as const).map((value) => ({
          label: `${value} verification`,
          value: submissions.filter(({ business }) => business.verification.status === value).length
        }))}
      />
      <Card className="overflow-hidden shadow-none">
        <div className="flex flex-wrap gap-3 border-b p-4">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search merchant, business name or email"
          />
          <FilterSelect
            label="Verification"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={['Pending', 'Approved', 'Declined', 'All']}
          />
        </div>
        <RecordsTable
          columns={[
            'Merchant',
            'Business name',
            'Email address',
            'Documents uploaded',
            'Latest upload',
            'Verification',
            'Action'
          ]}
          empty="No business submissions match your search or verification filter."
          rows={filtered
            .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
            .map(({ merchant, business }) => [
              <span key="name" className="font-medium">
                {merchant.name}
              </span>,
              business.name,
              merchant.email,
              `${business.documents.length} / ${REQUIRED_DOCUMENTS.length}`,
              date(business.verification.submittedAt, true),
              <StatusBadge key="status" status={business.verification.status} />,
              <Button key="review" variant="outline" size="sm" asChild>
                <Link href={`/dashboard/document-verification/${merchant.id}/${business.id}`}>
                  {business.verification.status === 'Pending'
                    ? 'Review documents'
                    : 'View decision'}
                </Link>
              </Button>
            ])}
        />
        <Pagination count={filtered.length} page={currentPage} onChange={setPage} />
      </Card>
    </div>
  );
}
