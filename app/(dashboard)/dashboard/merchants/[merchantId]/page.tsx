import MerchantDetails from '@/components/VirtualAccounts/MerchantDetails';
export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ merchantId: string }>;
  searchParams: Promise<{ tab?: string; business?: string }>;
}) {
  const { merchantId } = await params;
  const { tab, business } = await searchParams;
  return (
    <MerchantDetails
      key={`${merchantId}-${tab || 'profile'}-${business || ''}`}
      merchantId={merchantId}
      initialTab={tab === 'tills' || tab === 'transactions' ? tab : 'profile'}
      initialBusinessId={business}
    />
  );
}
