'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DataState,
  DateFilters,
  date,
  inRange,
  PageHeading,
  PAGE_SIZE,
  Pagination,
  RecordsTable,
  SearchInput,
  StatusBadge,
  useDashboard
} from './shared';
export default function Approvals() {
  const query = useDashboard();
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  if (!query.data) return <DataState query={query} />;
  const rows = query.data.merchants
    .flatMap((merchant) =>
      merchant.businesses
        .filter((business) => business.documents.length)
        .map((business) => ({ merchant, business }))
    )
    .filter(
      ({ merchant, business }) =>
        business.verification.status === 'Pending' &&
        `${merchant.name} ${business.name}`.toLowerCase().includes(search.toLowerCase()) &&
        inRange(business.verification.submittedAt, from, to)
    )
    .sort((a, b) =>
      b.business.verification.submittedAt.localeCompare(a.business.verification.submittedAt)
    );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / PAGE_SIZE)));
  return (
    <div className="space-y-6">
      <PageHeading
        title="Approvals"
        description="Review each business document package and record a verification decision."
      />
      <Card className="shadow-none">
        <div className="flex flex-wrap gap-3 p-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search merchant or business"
          />
          <DateFilters
            from={from}
            to={to}
            onFrom={(v) => {
              setFrom(v);
              setPage(1);
            }}
            onTo={(v) => {
              setTo(v);
              setPage(1);
            }}
          />
        </div>
        <RecordsTable
          columns={[
            'Merchant name',
            'Business name',
            'Date submitted',
            'Documents uploaded',
            'Verification status',
            'Action'
          ]}
          rows={rows
            .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
            .map(({ merchant, business }) => [
              merchant.name,
              business.name,
              date(business.verification.submittedAt),
              `${business.documents.length} documents`,
              <StatusBadge key="status" status={business.verification.status} />,
              <Button key="review" asChild size="sm" variant="outline">
                <Link href={`/dashboard/document-verification/${merchant.id}/${business.id}`}>
                  Review submission
                </Link>
              </Button>
            ])}
        />
        <Pagination count={rows.length} page={currentPage} onChange={setPage} />
      </Card>
    </div>
  );
}
