import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { signOut } from "@/lib/admin/actions";

const NAV = [
  ["Dashboard", "/admin"], ["Studio submissions", "/admin/submissions"], ["Bookings", "/admin/bookings"], ["Availability", "/admin/availability"],
  ["Inquiries", "/admin/inquiries"], ["Portfolio & media", "/admin/portfolio"], ["Reviews", "/admin/reviews"], ["Categories", "/admin/categories"],
  ["Studio templates", "/admin/templates"], ["Website content", "/admin/content"], ["Integrations", "/admin/integrations"],
];

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-neutral-200 bg-white p-5 lg:border-b-0 lg:border-r">
        <Link href="/admin" className="block text-lg font-semibold">The Celebrations <span className="font-normal text-neutral-500">Admin</span></Link>
        <nav className="mt-6 flex gap-1 overflow-x-auto lg:flex-col">
          {NAV.map(([label, href]) => <Link key={href} href={href} className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100">{label}</Link>)}
        </nav>
        <div className="mt-8 hidden border-t border-neutral-200 pt-4 text-xs text-neutral-500 lg:block">
          <p className="truncate">{user.email}</p>
          <div className="mt-2 flex gap-3">
            <Link href="/" className="hover:text-neutral-900">View site ↗</Link>
            <form action={signOut}><button className="hover:text-neutral-900">Sign out</button></form>
          </div>
        </div>
      </aside>
      <main className="p-5 lg:p-10">{children}</main>
    </div>
  );
}
