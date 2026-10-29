'use client';
import { usePathname, useRouter } from 'next/navigation';
import { BiMenu } from 'react-icons/bi';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/store/hooks';
import { logoutUser } from '@/store/slice/userService/userService';
import { stopTokenRefreshTimer } from '@/app/utils/token';
import { removeCookie } from '@/app/utils/cookies';
import { toast } from 'sonner';

interface TopBarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const getDashboardPageTitle = (pathname: string) =>
  pathname.startsWith('/dashboard/merchants')
    ? 'Merchants'
    : pathname.startsWith('/dashboard/disputes')
      ? 'Disputes'
      : pathname.startsWith('/dashboard/users')
        ? 'Users'
        : pathname.startsWith('/dashboard/approvals')
          ? 'Approvals'
          : pathname.startsWith('/dashboard/document-verification')
            ? 'Document Verification'
            : 'Overview';

export default function TopBar({ onToggleSidebar, isSidebarOpen }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const module = getDashboardPageTitle(pathname);

  const logoutAction = () => {
    stopTokenRefreshTimer();
    dispatch(logoutUser());
    removeCookie('ttl');
    router.push('/login');
    toast('Successfully Logout', { closeButton: true, richColors: true });
  };

  return (
    <nav className="flex h-16 items-center gap-2 border-b border-gray-200 bg-white px-4 lg:ml-60">
      <button
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={isSidebarOpen}
        onClick={onToggleSidebar}
        className="rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
      >
        <BiMenu size={20} />
      </button>
      <span className="min-w-0 truncate text-[18px] font-bold text-gray-900">{module}</span>
      <Button type="button" onClick={logoutAction} className="ml-auto h-9 gap-2 px-3">
        <LogOut size={16} aria-hidden="true" />
        <span>Logout</span>
      </Button>
    </nav>
  );
}
