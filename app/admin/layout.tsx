import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · The Celebrations" }, robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell min-h-screen bg-neutral-50 font-sans text-neutral-900 [color-scheme:light]">
      <style>{`body.grain::after{display:none} html.has-cursor,html.has-cursor *{cursor:auto!important}`}</style>
      {children}
    </div>
  );
}
