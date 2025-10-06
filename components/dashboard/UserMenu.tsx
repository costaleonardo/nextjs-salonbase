"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { handleSignOut } from "@/app/actions/user";

interface UserMenuProps {
  userName: string;
  userRole: string;
}

export default function UserMenu({ userName, userRole }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <UserCircleIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
        <span className="hidden md:block">{userName}</span>
        <ChevronDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="ring-opacity-5 absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black focus:outline-none">
          <div className="py-1">
            <div className="border-b border-gray-100 px-4 py-2">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{userRole}</p>
            </div>

            <form action={handleSignOut}>
              <button
                type="submit"
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
