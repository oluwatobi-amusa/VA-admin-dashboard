'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { demoIdentity, Role, ROLES } from '@/lib/approval-workflow';
const Context = createContext<Role>('Admin');
export const useDemoRole = () => useContext(Context);
export default function DemoRole({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('Admin');
  useEffect(() => {
    setRole(demoIdentity.role());
  }, []);
  return (
    <Context.Provider value={role}>
      <div className="fixed bottom-3 right-3 z-50 flex max-w-[calc(100%-24px)] flex-wrap items-center gap-3 rounded-lg border bg-blue-50 px-4 py-2 text-xs text-blue-800 shadow-sm">
        <span>Demo mode · Browser data only · No real emails are sent</span>
        <label>
          Demo role{' '}
          <select
            className="ml-2 rounded border bg-white p-1"
            value={role}
            onChange={(e) => {
              const next = e.target.value as Role;
              localStorage.setItem('virtual-account-demo-role', next);
              setRole(next);
            }}
          >
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>
      {children}
    </Context.Provider>
  );
}
