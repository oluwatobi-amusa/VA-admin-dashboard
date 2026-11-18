import { IconType } from 'react-icons/lib';
import { BiCheckShield } from 'react-icons/bi';
import { RiExchangeDollarLine } from 'react-icons/ri';
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
  { name: 'Business verification', url: '/dashboard/document-verification', icon: BiCheckShield },
  { name: 'Transaction history', url: '/dashboard/transactions', icon: RiExchangeDollarLine },
  { name: 'Users', url: '/dashboard/users', icon: HiUsers }
];
