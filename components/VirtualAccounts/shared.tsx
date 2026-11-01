'use client';

import { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { virtualAccountsService } from '@/app/(dashboard)/dashboard/queries/virtual-accounts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

export const DATA_KEY = ['virtual-accounts'];
export const PAGE_SIZE = 5;
export const money = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const date = (value: string, withTime = false) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(new Date(value));
export const inRange = (value: string, from: string, to: string) => {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value));
  return (!from || day >= from) && (!to || day <= to);
};
export function useDashboard() {
  return useQuery({
    queryKey: DATA_KEY,
    queryFn: virtualAccountsService.getDashboard,
    retry: false
  });
}
export function PageHeading({
  title,
  description,
  back
}: {
  title: string;
  description?: string;
  back?: { href: string; label: string };
}) {
  return (
    <div className="space-y-2">
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-2 text-sm text-starter-primary hover:underline"
        >
          <ArrowLeft size={16} />
          {back.label}
        </Link>
      )}
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  );
}
export function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'Active' || status === 'Successful' || status === 'Approved'
      ? 'border-green-200 bg-green-50 text-green-700'
      : status === 'Pending' || status.startsWith('Pending ')
        ? 'border-orange-200 bg-orange-50 text-orange-700'
        : 'border-red-200 bg-red-50 text-red-700';
  return (
    <Badge variant="outline" className={`${color} gap-1.5 whitespace-nowrap text-xs font-medium`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </Badge>
  );
}
export function SummaryCards({ items }: { items: { label: string; value: string | number }[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => {
        return (
          <Card key={item.label} className="shadow-none">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-gray-500">{item.label}</p>
              </div>
              <p className="break-words text-[20px] font-bold text-gray-900"> {item.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
export function State({
  title,
  description,
  retry,
  loading = false
}: {
  title: string;
  description?: string;
  retry?: () => void;
  loading?: boolean;
}) {
  return (
    <div role={loading ? 'status' : 'alert'} className="rounded-lg border bg-white p-8 text-center">
      <div className="flex items-center justify-center gap-2 font-medium text-gray-900">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {title}
      </div>
      {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
      {retry && (
        <Button variant="outline" className="mt-4" onClick={retry}>
          Retry
        </Button>
      )}
    </div>
  );
}
export function DataState({ query }: { query: ReturnType<typeof useDashboard> }) {
  return (
    <State
      loading={query.isPending}
      title={query.isPending ? 'Loading account data…' : 'Unable to load account data'}
      description={query.error?.message}
      retry={
        query.isError
          ? () => {
              void query.refetch();
            }
          : undefined
      }
    />
  );
}
export function SearchInput({
  value,
  onChange,
  label = 'Search',
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder: string;
}) {
  return (
    <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs text-gray-600">
      <span>{label}</span>
      <span className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          aria-label={label}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9"
        />
      </span>
    </label>
  );
}
export function FilterSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-gray-600">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-md border bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-starter-primary"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
export function DateFilters({
  from,
  to,
  onFrom,
  onTo
}: {
  from: string;
  to: string;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}) {
  return (
    <>
      <label className="flex flex-col gap-1 text-xs text-gray-600">
        <span>From</span>
        <Input
          className="w-auto"
          type="date"
          aria-label="From date"
          value={from}
          max={to || undefined}
          onChange={(e) => onFrom(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-gray-600">
        <span>To</span>
        <Input
          className="w-auto"
          type="date"
          aria-label="To date"
          value={to}
          min={from || undefined}
          onChange={(e) => onTo(e.target.value)}
        />
      </label>
    </>
  );
}
export function RecordsTable({
  columns,
  rows,
  empty = 'No matching records. Try changing your search or filters.'
}: {
  columns: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  const monetary = (label: string) =>
    ['Combined Till balances', 'Current balance', 'Amount'].includes(label);
  return (
    <Table>
      <TableHeader className="bg-gray-50">
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column}
              className={`whitespace-nowrap text-[16px] font-bold ${monetary(column) ? 'text-right' : ''}`}
            >
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length ? (
          rows.map((cells, i) => (
            <TableRow key={i}>
              {cells.map((cell, j) => (
                <TableCell
                  key={j}
                  className={`whitespace-nowrap text-[16px] font-sans ${monetary(columns[j]) ? 'text-right tabular-nums' : ''}`}
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="py-10 text-center text-gray-500">
              {empty}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
export function Pagination({
  count,
  page,
  onChange
}: {
  count: number;
  page: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-xs text-gray-500">
      <p>
        {count
          ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, count)} of ${count} records`
          : '0 records'}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <span>
          Page {page} of {pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
export function Fields({ entries, columns }: { entries: [string, ReactNode][]; columns?: number }) {
  return (
    <dl
      className={`grid gap-x-6 gap-y-5 sm:grid-cols-2 ${
        columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-4'
      }`}
    >
      {entries.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="mb-1 text-xs text-gray-500">{label}</dt>
          <dd
            className="truncate text-sm font-medium text-gray-900"
            title={typeof value === 'string' ? value : undefined}
          >
            {value || 'Not provided'}
          </dd>
        </div>
      ))}
    </dl>
  );
}
