import Link from "next/link";

/** Barber admin nav — a scrollable chip row, usable one-handed on a phone. */
export default function AdminNav() {
  const links = [
    ["/admin", "Today"],
    ["/admin/inbox", "Inbox"],
    ["/admin/diary", "Diary"],
    ["/admin/members", "Members"],
    ["/admin/numbers", "Numbers"],
    ["/admin/scan", "Scan"],
    ["/admin/settings", "Settings"],
  ];
  return (
    <nav className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {links.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          className="shrink-0 rounded-full px-3 py-1.5 text-sm text-steel hover:bg-mist hover:text-ink"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
