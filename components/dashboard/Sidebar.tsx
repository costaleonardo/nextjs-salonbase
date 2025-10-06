"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  UsersIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  userRole: "OWNER" | "STAFF";
}

const navigationItems = [
  {
    name: "Appointments",
    href: "/dashboard/appointments",
    icon: CalendarIcon,
    roles: ["OWNER", "STAFF"],
  },
  {
    name: "Clients",
    href: "/dashboard/clients",
    icon: UsersIcon,
    roles: ["OWNER", "STAFF"],
  },
  {
    name: "Services",
    href: "/dashboard/services",
    icon: Cog6ToothIcon,
    roles: ["OWNER", "STAFF"],
  },
  {
    name: "Payments",
    href: "/dashboard/payments",
    icon: CreditCardIcon,
    roles: ["OWNER", "STAFF"],
  },
  {
    name: "Staff",
    href: "/dashboard/staff",
    icon: UserGroupIcon,
    roles: ["OWNER"],
  },
];

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const filteredNavigation = navigationItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/dashboard" className="text-xl font-bold text-gray-900">
          SalonBase
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main navigation">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              } `}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"} `}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
