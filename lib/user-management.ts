import { demoIdentity, Role, ROLES } from './approval-workflow';
export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'Pending' | 'Accepted' | 'Disabled';
  invitedAt: string;
  token?: string;
}
const KEY = 'virtual-account-users-v1';
const initial: ManagedUser[] = ROLES.map((role, i) => ({
  id: `user-${i}`,
  name: ['Ada Okeke', 'Chidi Eze', 'Amina Bello'][i],
  email: `${role.toLowerCase()}@example.com`,
  role,
  status: 'Accepted',
  invitedAt: '2026-10-01T09:00:00+01:00'
}));
function read(): ManagedUser[] {
  return JSON.parse(localStorage.getItem(KEY) || JSON.stringify(initial));
}
function admin() {
  if (demoIdentity.role() !== 'Admin') throw new Error('Only Admin users can manage invitations.');
}
function save(users: ManagedUser[]) {
  localStorage.setItem(KEY, JSON.stringify(users));
}
/** Browser-only adapter. Replace with authenticated API and email delivery when available. */
export const userManagementService = {
  list() {
    admin();
    return read();
  },
  invite(name: string, email: string, role: Role) {
    admin();
    email = email.trim().toLowerCase();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !ROLES.includes(role))
      throw new Error('Enter a full name, valid email address and role.');
    const users = read();
    if (users.some((u) => u.email.toLowerCase() === email))
      throw new Error('This email already belongs to a user or pending invitation.');
    const user: ManagedUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email,
      role,
      status: 'Pending',
      invitedAt: new Date().toISOString(),
      token: crypto.randomUUID()
    };
    save([...users, user]);
    return user;
  },
  resend(id: string) {
    admin();
    const users = read();
    const user = users.find((u) => u.id === id);
    if (!user || user.status !== 'Pending')
      throw new Error('Only pending invitations can be resent.');
    user.token = crypto.randomUUID();
    save(users);
    return user;
  },
  toggleAccess(id: string) {
    admin();
    const users = read();
    const user = users.find((item) => item.id === id);
    if (!user || user.status === 'Pending')
      throw new Error('Only accepted users can be enabled or disabled.');
    user.status = user.status === 'Accepted' ? 'Disabled' : 'Accepted';
    save(users);
    return user;
  },
  inspect(token: string) {
    return read().find((u) => u.token === token && u.status === 'Pending');
  },
  accept(token: string, password: string) {
    if (password.length < 8) throw new Error('Use at least 8 characters for your demo password.');
    const users = read();
    const user = users.find((u) => u.token === token && u.status === 'Pending');
    if (!user) throw new Error('This invitation has already been accepted or replaced.');
    user.status = 'Accepted';
    delete user.token;
    save(users);
    return user;
  }
};
