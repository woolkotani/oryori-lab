"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/dishes", label: "記録", icon: "🍽️" },
  { href: "/recipes", label: "レシピ", icon: "📖" },
  { href: "/nutrition", label: "栄養", icon: "💪" },
  { href: "/cost", label: "コスト", icon: "💰" },
  { href: "/suggestions", label: "リョボット", icon: "🤖" },
  { href: "/motivation", label: "実績", icon: "🏆" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 md:relative md:border-t-0 md:border-r md:h-screen md:w-20 md:flex md:flex-col md:items-center md:pt-6">
      <div className="flex md:flex-col gap-1 justify-around md:justify-start md:gap-2 px-2 py-2 md:px-0 md:py-0 w-full">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-2 py-2 text-xs gap-1 transition-colors md:w-14 md:h-14",
                active
                  ? "bg-orange-50 text-orange-500"
                  : "text-gray-400 hover:text-orange-400 hover:bg-orange-50"
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="hidden md:block">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
