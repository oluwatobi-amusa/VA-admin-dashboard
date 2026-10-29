'use client';

import { useDemoRole } from '@/components/VirtualAccounts/DemoRole';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FC } from 'react';
import { LINKS, LINK_ICON_STYLE } from './constants';
import { cn } from '@/lib/utils';
import { DASHBOARD_ROUTE } from '@/config';
import { BiUser } from 'react-icons/bi';
// import MarbleLogo from '@/public/SidebarLogo.svg';
import TopBarDropdownMenu from '../Topbar/DropDown';
import { X } from 'lucide-react';

interface SidebarProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const Sidebar: FC<SidebarProps> = ({ isSidebarOpen = true, onToggleSidebar }) => {
  const pathname = usePathname();
  const role = useDemoRole();

  const checkIfLinkIsActive = (link: string) => {
    if (DASHBOARD_ROUTE.includes(link)) {
      return pathname === link;
    }

    return pathname.startsWith(link);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggleSidebar}
        />
      )}

      <div
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-60 flex-col bg-white border-r border-gray-200  transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header with Logo */}
        <div className="flex items-center justify-between  p-4 z-50">
          <div className="flex items-center gap-2">
            {/* <MarbleLogo /> */}
            <p className="text-sm font-bold text-starter-primary">Virtual Account Admin Dashboard</p>
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onToggleSidebar}
            className="lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-2 py-3">
          <div className="grid space-y-[10px]">
            {LINKS.map((link) => {
              const SideBarIcon = link.icon;
              const isActive = checkIfLinkIsActive(link.url);

              if (link.name === 'Users' && role !== 'Admin') {
                return (
                  <div
                    key={link.name}
                    aria-disabled="true"
                    title="Select Admin in the Demo role selector to manage users."
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-[16px] font-medium text-gray-400"
                  >
                    <SideBarIcon style={LINK_ICON_STYLE} />
                    <span>Users</span>
                    <span className="ml-auto text-xs">Admin only</span>
                  </div>
                );
              }

              return (
                <Link
                  href={link.url}
                  key={link.name}
                  onClick={() => {
                    // Close sidebar on mobile when link is clicked
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      onToggleSidebar?.();
                    }
                  }}
                >
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-[16px] font-medium text-gray-700 transition-all duration-200 hover:bg-gray-100',
                      isActive && 'bg-blue-50 text-starter-primary shadow-sm'
                    )}
                  >
                    <SideBarIcon
                      style={LINK_ICON_STYLE}
                      className={cn('text-gray-500', isActive && 'text-starter-primary')}
                    />
                    <span className="truncate">{link.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
              <BiUser className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <TopBarDropdownMenu />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
