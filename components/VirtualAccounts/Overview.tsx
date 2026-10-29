'use client';
import { DataState, inRange, money, SummaryCards, useDashboard } from './shared';

export default function Overview() {
  const query = useDashboard();
  if (!query.data) return <DataState query={query} />;
  const { merchants, tills, transactions } = query.data;
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
  const currentMonth = today.slice(0, 7);
  const successfulVolume = (from: string, to: string) =>
    transactions
      .filter(
        (transaction) => transaction.status === 'Successful' && inRange(transaction.date, from, to)
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <div className="space-y-6">
      <SummaryCards
        items={[
          {
            label: 'Total Merchants',
            value: merchants.length
          },
          {
            label: 'Active Virtual Accounts',
            value: tills.filter((till) => till.status === 'Active').length
          },
          {
            label: 'Payment Value',
            value: money(
              transactions
                .filter((t) => t.status === 'Successful' && t.type === 'Credit')
                .reduce((sum, t) => sum + t.amount, 0)
            )
          },
          {
            label: 'Total Till Accounts',
            value: tills.length
          },
          {
            label: 'Total Businesses',
            value: merchants.reduce((count, merchant) => count + merchant.businesses.length, 0)
          },
          {
            label: 'Transaction Volume (current day)',
            value: money(successfulVolume(today, today))
          },
          {
            label: 'Transaction Volume (current month)',
            value: money(successfulVolume(`${currentMonth}-01`, `${currentMonth}-31`))
          },
          {
            label: 'Pending Business Approvals',
            value: merchants.reduce(
              (count, merchant) =>
                count +
                merchant.businesses.filter((business) => business.verification.status === 'Pending')
                  .length,
              0
            )
          }
        ]}
      />
    </div>
  );
}
