"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bars3Icon,
  XMarkIcon,
  CalendarIcon,
  UsersIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

interface MobileNavProps {
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
  {
    name: "Import Data",
    href: "/dashboard/import",
    icon: ArrowDownTrayIcon,
    roles: ["OWNER"],
  },
];

export default function MobileNav({ userRole }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const filteredNavigation = navigationItems.filter((item) => item.roles.includes(userRole));

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="bg-opacity-75 fixed inset-0 z-40 bg-gray-600 lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white lg:hidden">
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
              <Link
                href="/dashboard"
                className="text-xl font-bold text-gray-900"
                onClick={() => setIsOpen(false)}
              >
                SalonBase
              </Link>
              <button
                type="button"
                className="rounded-md p-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
                aria-label="Close navigation menu"
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <nav className="space-y-1 px-3 py-4" aria-label="Mobile navigation">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center rounded-md px-3 py-3 text-base font-medium ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    } `}
                    onClick={() => setIsOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <item.icon
                      className={`mr-4 h-6 w-6 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"} `}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
