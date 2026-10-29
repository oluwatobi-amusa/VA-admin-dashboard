'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Role, ROLES } from '@/lib/approval-workflow';
import { ManagedUser, userManagementService as service } from '@/lib/user-management';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useDemoRole } from './DemoRole';
import {
  date,
  FilterSelect,
  PageHeading,
  PAGE_SIZE,
  Pagination,
  RecordsTable,
  SearchInput,
  State,
  StatusBadge
} from './shared';
export default function Users() {
  const role = useDemoRole();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('Staff');
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All roles');
  const [status, setStatus] = useState('All statuses');
  const [page, setPage] = useState(1);
  useEffect(() => {
    if (role === 'Admin') setUsers(service.list());
  }, [role]);
  if (role !== 'Admin')
    return (
      <State
        title="Admin access required"
        description="Only Admin users can access User Management."
      />
    );
  function showLink(user: ManagedUser) {
    setLink(`${window.location.origin}/accept-invitation/${user.token}`);
    setUsers(service.list());
  }
  const filtered = users.filter(
    (u) =>
      `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'All roles' || u.role === filter) &&
      (status === 'All statuses' || u.status === status)
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <PageHeading title="Users" description="Manage team access and account invitations." />
        <Button
          onClick={() => {
            setOpen(true);
            setError('');
          }}
        >
          Invite user
        </Button>
      </div>
      {link && (
        <Card className="space-y-2 p-4">
          <p className="text-sm font-medium">Demo setup link created. No email was sent.</p>
          <a className="block break-all text-sm text-blue-700 underline" href={link}>
            {link}
          </a>
          <p className="text-xs text-gray-500">
            Open this link in this browser to demonstrate account setup. Resending replaces the
            previous link.
          </p>
        </Card>
      )}
      <Card>
        <div className="flex flex-wrap gap-3 p-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search name or email"
          />
          <FilterSelect
            label="Role"
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setPage(1);
            }}
            options={['All roles', ...ROLES]}
          />
          <FilterSelect
            label="Invitation status"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={['All statuses', 'Pending', 'Accepted']}
          />
        </div>
        <RecordsTable
          columns={[
            'Full name',
            'Email address',
            'Role',
            'Invitation status',
            'Date invited',
            'Action'
          ]}
          rows={filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((u) => [
            u.name,
            u.email,
            u.role,
            <StatusBadge key="status" status={u.status} />,
            date(u.invitedAt),
            u.status === 'Pending' ? (
              <Button
                key="resend"
                variant="outline"
                size="sm"
                onClick={() => {
                  try {
                    showLink(service.resend(u.id));
                    toast.success('Demo invitation regenerated. No email sent.');
                  } catch (e) {
                    toast.error((e as Error).message);
                  }
                }}
              >
                Resend invitation
              </Button>
            ) : (
              '—'
            )
          ])}
        />
        <Pagination count={filtered.length} page={currentPage} onChange={setPage} />
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
            <DialogDescription>
              Create a demo account setup link with the selected role. No real email is sent.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                showLink(service.invite(name, email, inviteRole));
                setOpen(false);
                setName('');
                setEmail('');
              } catch (cause) {
                setError((cause as Error).message);
              }
            }}
          >
            <label className="block text-sm">
              Full name
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={150}
              />
            </label>
            <label className="block text-sm">
              Email address
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={254}
              />
            </label>
            <FilterSelect
              label="Role"
              value={inviteRole}
              onChange={(v) => setInviteRole(v as Role)}
              options={[...ROLES]}
            />
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create invitation</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
