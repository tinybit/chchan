"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminTabs({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="tabs">
      {tabs.map((tab) => (
        <Link key={tab.href} href={tab.href} className={pathname === tab.href ? "active" : ""}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
