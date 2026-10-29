'use client';
import { useState } from 'react';
import Link from 'next/link';
import { approvalStatus, ROLES, stepStatus, workflowService } from '@/lib/approval-workflow';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDemoRole } from './DemoRole';
import {
  DataState,
  DateFilters,
  date,
  FilterSelect,
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
  const role = useDemoRole();
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('All stages');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  if (!query.data) return <DataState query={query} />;
  const rows = workflowService
    .all()
    .flatMap((s) => {
      const merchant = query.data.merchants.find((m) => m.id === s.merchantId);
      const business = merchant?.businesses.find((b) => b.id === s.businessId);
      return merchant && business ? [{ s, merchant, business }] : [];
    })
    .filter(
      ({ s, merchant, business }) =>
        (tab === 'pending'
          ? ROLES.includes(s.stage as typeof role) &&
            workflowService.history(s.merchantId, s.businessId).at(-1)?.id === s.id
          : !ROLES.includes(s.stage as typeof role)) &&
        `${merchant.name} ${business.name}`.toLowerCase().includes(search.toLowerCase()) &&
        (stage === 'All stages' || s.stage === stage) &&
        inRange(s.submittedAt, from, to)
    )
    .sort(
      (a, b) =>
        Number(b.s.stage === role) - Number(a.s.stage === role) ||
        b.s.submittedAt.localeCompare(a.s.submittedAt)
    );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / PAGE_SIZE)));
  return (
    <div className="space-y-6">
      <PageHeading
        title="Approvals"
        description="Review each business document package through Staff, Compliance and Admin."
      />
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v);
          setPage(1);
          setStage('All stages');
        }}
      >
        <TabsList>
          <TabsTrigger value="pending">Pending approvals</TabsTrigger>
          <TabsTrigger value="history">Approval history</TabsTrigger>
        </TabsList>
      </Tabs>
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
          <FilterSelect
            label="Current stage"
            value={stage}
            onChange={(v) => {
              setStage(v);
              setPage(1);
            }}
            options={['All stages', ...(tab === 'pending' ? [...ROLES] : ['Approved', 'Rejected'])]}
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
            'Current approval stage',
            'Staff review',
            'Compliance review',
            'Admin review',
            'Action'
          ]}
          rows={rows
            .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
            .map(({ s, merchant, business }) => [
              merchant.name,
              business.name,
              date(s.submittedAt),
              <div key="stage" className={s.stage === role ? 'rounded bg-blue-50 p-2' : ''}>
                <StatusBadge status={approvalStatus(s)} />
                {s.stage === role && (
                  <p className="mt-1 text-xs text-blue-700">Your review required</p>
                )}
              </div>,
              ...ROLES.map((r) => <StatusBadge key={r} status={stepStatus(s, r)} />),
              <Button key="review" asChild size="sm" variant="outline">
                <Link href={`/dashboard/approvals/${s.id}`}>Review submission</Link>
              </Button>
            ])}
        />
        <Pagination count={rows.length} page={currentPage} onChange={setPage} />
      </Card>
    </div>
  );
}
