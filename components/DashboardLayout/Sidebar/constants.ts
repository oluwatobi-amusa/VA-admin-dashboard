import { IconType } from 'react-icons/lib';
import { BiBookAlt, BiCheckShield } from 'react-icons/bi';
import { BsFillGridFill } from 'react-icons/bs';
import { HiUsers } from 'react-icons/hi2';

export const LINK_ICON_STYLE = { height: '20px', width: '20px' };

export type SideBarLink = {
  icon: IconType;
  name: string;
  url: string;
};

export type SideBarLinks = SideBarLink[];

export const LINKS: SideBarLinks = [
  {
    name: 'Overview',
    url: '/dashboard',
    icon: BsFillGridFill
  },
  { name: 'Merchants', url: '/dashboard/merchants', icon: HiUsers },
  { name: 'Document Verification', url: '/dashboard/document-verification', icon: BiCheckShield },
  { name: 'Users', url: '/dashboard/users', icon: HiUsers },
  { name: 'Approvals', url: '/dashboard/approvals', icon: BiCheckShield },
  { name: 'Disputes', url: '/dashboard/disputes', icon: BiBookAlt }
];
