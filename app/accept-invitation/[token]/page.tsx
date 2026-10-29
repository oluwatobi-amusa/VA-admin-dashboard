import AcceptInvitation from '@/components/VirtualAccounts/AcceptInvitation';
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AcceptInvitation token={token} />;
}
