'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DataState,
  DateFilters,
  PageHeading,
  Pagination,
  PAGE_SIZE,
  RecordsTable,
  SearchInput,
  StatusBadge,
  date,
  inRange,
  money,
  useDashboard
} from './shared';

export default function Transactions() {
  const query = useDashboard();
  const [search, setSearch] = useState('');
  const [accountType, setAccountType] = useState('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const change = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  if (!query.data) return <DataState query={query} />;

  const { merchants, tills, transactions } = query.data;
  const tillById = new Map(tills.map((till) => [till.id, till]));
  const businessById = new Map(
    merchants.flatMap((merchant) =>
      merchant.businesses.map((business) => [business.id, { ...business, merchant }] as const)
    )
  );
  const searchTerm = search.trim().toLowerCase();
  const filtered = transactions.filter((transaction) => {
    const till = tillById.get(transaction.tillId);
    const business = till ? businessById.get(till.businessId) : undefined;
    return (
      transaction.reference.toLowerCase().includes(searchTerm) &&
      (accountType === 'All' || till?.accountType === accountType) &&
      inRange(transaction.date, from, to) &&
      Boolean(business)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeading
        title="Transaction history"
        description="View transactions across all dynamic and static virtual accounts."
      />
      <Card className="overflow-hidden shadow-none">
        <div className="space-y-3 border-b p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">All transactions</h2>
            <span className="text-xs text-gray-500">{transactions.length} transactions</span>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <SearchInput
              label="Search by reference number"
              value={search}
              onChange={change(setSearch)}
              placeholder="Search transaction reference"
            />
            <label className="flex flex-col gap-1 text-xs text-gray-600">
              <span>Account type</span>
              <select
                aria-label="Account type"
                value={accountType}
                onChange={(event) => change(setAccountType)(event.target.value)}
                className="h-10 min-w-[220px] rounded-md border bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-starter-primary"
              >
                <option value="All">All account types</option>
                <option value="Dynamic">Dynamic</option>
                <option value="Static">Static</option>
              </select>
            </label>
            <DateFilters from={from} to={to} onFrom={change(setFrom)} onTo={change(setTo)} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setAccountType('All');
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
            <p role="alert" className="text-xs text-red-600">
              From date must be before To date.
            </p>
          )}
        </div>
        <RecordsTable
          columns={[
            'Transaction reference',
            'Date and time',
            'Merchant',
            'Business',
            'Account type',
            'Amount',
            'Status'
          ]}
          empty={
            transactions.length
              ? 'No transactions match your search or filters.'
              : 'No transactions yet.'
          }
          rows={filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((transaction) => {
            const till = tillById.get(transaction.tillId);
            const business = till ? businessById.get(till.businessId) : undefined;
            return [
              <span key="reference" className="font-medium text-starter-primary">
                {transaction.reference}
              </span>,
              date(transaction.date, true),
              business?.merchant.name || 'Not provided',
              business?.name || 'Not provided',
              till?.accountType || 'Not provided',
              money(transaction.amount),
              <StatusBadge key="status" status={transaction.status} />
            ];
          })}
        />
        <Pagination count={filtered.length} page={page} onChange={setPage} />
      </Card>
    </div>
  );
}
