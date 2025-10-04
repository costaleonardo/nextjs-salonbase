"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline"

export default function Breadcrumb() {
  const pathname = usePathname()

  const pathSegments = pathname
    .split("/")
    .filter((segment) => segment !== "")
    .filter((segment) => segment !== "dashboard")

  const breadcrumbs = [
    { name: "Dashboard", href: "/dashboard", current: pathname === "/dashboard" },
  ]

  pathSegments.forEach((segment, index) => {
    const href = `/dashboard/${pathSegments.slice(0, index + 1).join("/")}`
    const name = segment.charAt(0).toUpperCase() + segment.slice(1)
    const current = pathname === href

    breadcrumbs.push({ name, href, current })
  })

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-500"
            aria-label="Home"
          >
            <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          </Link>
        </li>
        {breadcrumbs.slice(1).map((breadcrumb) => (
          <li key={breadcrumb.href} className="flex items-center">
            <ChevronRightIcon
              className="h-5 w-5 flex-shrink-0 text-gray-400"
              aria-hidden="true"
            />
            {breadcrumb.current ? (
              <span
                className="ml-2 text-sm font-medium text-gray-500"
                aria-current="page"
              >
                {breadcrumb.name}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                {breadcrumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
