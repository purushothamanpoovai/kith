"use client";

import { Link, usePathname } from "@/i18n/navigation";

type Props = {
  href: "/" | `/${string}`;
  children: React.ReactNode;
  className?: string;
  exact?: boolean;
};

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export function NavLink({ href, children, className = "ds-nav-link", exact }: Props) {
  const pathname = normalizePath(usePathname());
  const target = normalizePath(href);
  const isActive = exact
    ? pathname === target
    : pathname === target || (target !== "/" && pathname.startsWith(`${target}/`));

  return (
    <Link href={href} className={className} aria-current={isActive ? "page" : undefined}>
      {children}
    </Link>
  );
}
