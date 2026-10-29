'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DataState,
  DateFilters,
  FilterSelect,
  SearchInput,
  RecordsTable,
  Pagination,
  PAGE_SIZE,
  date,
  inRange,
  money,
  StatusBadge,
  SummaryCards,
  useDashboard
} from './shared';

export default function Merchants() {
  const query = useDashboard();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const change = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };
  if (!query.data) return <DataState query={query} />;
  const { merchants, tills } = query.data;
  const filtered = merchants.filter(
    (m) =>
      `${m.name} ${m.email}`.toLowerCase().includes(search.trim().toLowerCase()) &&
      (status === 'All' || m.status === status) &&
      inRange(m.createdAt, from, to)
  );
  return (
    <div className="space-y-6">
      <SummaryCards
        items={[
          {
            label: 'Total Merchants',
            value: merchants.length
          },
          {
            label: 'Virtual Accounts',
            value: merchants.filter((m) => m.status === 'Active').length
          },
          {
            label: 'Till accounts',
            value: tills.length
          }
        ]}
      />
      <Card className="overflow-hidden shadow-none">
        <div className="border-b p-4">
          <h2 className="mb-4 font-semibold">
            All merchants{' '}
            <span className="ml-2 text-xs font-normal text-gray-500">
              {merchants.length} merchants
            </span>
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              label="Search merchants"
              value={search}
              onChange={change(setSearch)}
              placeholder="Search merchant name or email"
            />
            <FilterSelect
              label="Status"
              value={status}
              onChange={change(setStatus)}
              options={['All', 'Active', 'Suspended']}
            />
            <DateFilters from={from} to={to} onFrom={change(setFrom)} onTo={change(setTo)} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatus('All');
                setFrom('');
                setTo('');
                setPage(1);
              }}
            >
              <X />
              Clear filters
            </Button>
          </div>
          {from && to && from > to && (
            <p role="alert" className="mt-2 text-xs text-red-600">
              From date must be before To date.
            </p>
          )}
        </div>
        <RecordsTable
          columns={[
            'Merchant name',
            'Email address',
            'Combined Till balances',
            'Till accounts',
            'Date created',
            'Status',
            'Verification',
            'Action'
          ]}
          empty={merchants.length ? undefined : 'No merchants yet.'}
          rows={filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((m) => {
            const accounts = tills.filter((t) => t.merchantId === m.id);
            return [
              <span key="name" className="font-medium">
                {m.name}
              </span>,
              m.email,
              money(accounts.reduce((sum, t) => sum + t.balance, 0)),
              accounts.length,
              date(m.createdAt),
              <StatusBadge key="status" status={m.status} />,
              <StatusBadge key="verification" status={m.verification.status} />,
              <span key="action" className="whitespace-nowrap">
                <Link
                  href={`/dashboard/merchants/${m.id}`}
                  className="inline-flex items-center gap-1 text-xs text-starter-primary"
                >
                  View merchant
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </span>
            ];
          })}
        />
        <Pagination count={filtered.length} page={page} onChange={setPage} />
      </Card>
    </div>
  );
}
