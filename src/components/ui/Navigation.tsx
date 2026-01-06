'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const menuItems = [
    { href: '/', label: 'Home' },
    { href: '/forecast', label: 'Forecast' },
    { href: '/regression', label: 'Regression' },
  ]

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-60 bg-[#161b22] border-r border-[#21262d] p-4 overflow-y-auto flex flex-col">
      <div className="mb-6">
        <h2 className="m-0 text-base font-semibold text-[#f0f6fc] tracking-tight">
          Edu ML
        </h2>
      </div>
      <ul className="list-none p-0 m-0 flex flex-col gap-0.5">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block py-2 transition-colors duration-150 ${
                  isActive
                    ? 'text-[#f0f6fc] underline'
                    : 'text-[#8b949e] no-underline hover:text-[#c9d1d9]'
                }`}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="mt-auto pt-4 text-xs text-[#8b949e]">
        @CBEPX4EJIOBEK, 2025
      </div>
    </nav>
  )
}
