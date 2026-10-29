'use client';

import DemoRole from '@/components/VirtualAccounts/DemoRole';
import { useState } from 'react';
import SideBar from '@/components/DashboardLayout/Sidebar';
import TopBar, { getDashboardPageTitle } from '@/components/DashboardLayout/Topbar';
import HOCLayout from '../provider/hocLayout';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = getDashboardPageTitle(pathname);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <DemoRole>
      <HOCLayout />
      <div className="h-screen overflow-hidden">
        <div className="fixed right-0 top-0 z-30 w-full max-w-full">
          <TopBar onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        </div>

        <div className="flex h-full">
          <div className="lg:w-60 lg:flex-shrink-0">
            <div className="fixed left-0 top-0 z-50 h-full  lg:relative">
              <SideBar isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-gray-50">
            <main className="relative mt-20 flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-24">
              <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                <Link href="/dashboard" className="hover:text-gray-900">Virtual Accounts</Link>
                <ChevronRight size={14} aria-hidden="true" />
                <span aria-current="page" className="text-gray-700">{pageTitle}</span>
              </nav>
              {children}
            </main>
          </div>
        </div>
      </div>
    </DemoRole>
  );
}
