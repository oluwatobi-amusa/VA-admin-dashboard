'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ManagedUser, userManagementService as service } from '@/lib/user-management';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export default function AcceptInvitation({ token }: { token: string }) {
  const [user, setUser] = useState<ManagedUser>();
  const [loaded, setLoaded] = useState(false);
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setUser(service.inspect(token));
    setLoaded(true);
  }, [token]);
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md space-y-4 p-6">
        <h1 className="text-xl font-semibold">Demo account setup</h1>
        <p className="text-sm text-gray-500">
          Browser-only demonstration. No real account or password is stored.
        </p>
        {!loaded ? (
          <p>Loading invitation…</p>
        ) : done ? (
          <>
            <p>
              Invitation accepted. {user?.name} has the {user?.role} role.
            </p>
            <Button asChild>
              <Link href="/dashboard">Return to dashboard</Link>
            </Button>
          </>
        ) : !user ? (
          <p role="alert">This invitation is invalid, replaced, or already accepted.</p>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                setUser(service.accept(token, password));
                setDone(true);
              } catch (cause) {
                setError((cause as Error).message);
              }
            }}
          >
            <p>
              {user.name} · {user.email} · {user.role}
            </p>
            <label className="block text-sm">
              Demo password
              <Input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            {error && (
              <p role="alert" className="text-red-600">
                {error}
              </p>
            )}
            <Button>Complete demo setup</Button>
          </form>
        )}
      </Card>
    </main>
  );
}
