import { requireAdmin } from "@/lib/admin/auth";
import { addBlackout, removeBlackout, saveAvailability } from "@/lib/admin/actions";
import { DEFAULT_RULES } from "@/lib/server/availability";
import { Card, Field, PageHead, btn, btnGhost, fmtDate, input } from "@/components/admin/ui";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function Availability() {
  const { supabase } = await requireAdmin();
  const [{ data: saved }, { data: blackouts }] = await Promise.all([
    supabase.from("availability_rules").select("*"),
    supabase.from("availability_blackouts").select("*").gte("ends_at", new Date().toISOString()).order("starts_at"),
  ]);
  const rules = saved?.length ? saved : DEFAULT_RULES;
  const slot = rules[0]?.slot_minutes ?? 45;

  return (
    <>
      <PageHead title="Availability" />
      {!saved?.length && <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">No rules saved yet. The public booking page is using the default studio hours shown below until you save.</p>}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Weekly hours <span className="font-normal text-neutral-500">({process.env.DEFAULT_TIMEZONE || "America/Chicago"})</span></h2>
          <form action={saveAvailability} className="mt-4 grid gap-3">
            {DAYS.map((day, i) => {
              const r = rules.find((x) => x.weekday === i);
              return (
                <div key={day} className="grid grid-cols-[130px_1fr_1fr] items-center gap-3 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" name={`on_${i}`} defaultChecked={Boolean(r)} /> {day}</label>
                  <input type="time" name={`start_${i}`} defaultValue={r?.start_time?.slice(0, 5) ?? "11:00"} className={input} />
                  <input type="time" name={`end_${i}`} defaultValue={r?.end_time?.slice(0, 5) ?? "18:00"} className={input} />
                </div>
              );
            })}
            <Field label="Consultation length (minutes)"><input type="number" name="slot_minutes" min={15} max={240} step={5} defaultValue={slot} className={`${input} w-32`} /></Field>
            <button className={`${btn} w-max`}>Save hours</button>
          </form>
        </Card>
        <Card>
          <h2 className="font-semibold">Time off &amp; blocked periods</h2>
          <form action={addBlackout} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="From"><input type="datetime-local" name="starts_at" required className={input} /></Field>
            <Field label="To"><input type="datetime-local" name="ends_at" required className={input} /></Field>
            <Field label="Reason (internal)"><input name="reason" className={input} /></Field>
            <div className="flex items-end"><button className={btn}>Block time</button></div>
          </form>
          <ul className="mt-6 divide-y divide-neutral-100 text-sm">
            {(blackouts ?? []).map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2">
                <span>{fmtDate(b.starts_at)} → {fmtDate(b.ends_at)} {b.reason && <span className="text-neutral-500">· {b.reason}</span>}</span>
                <form action={removeBlackout}><input type="hidden" name="id" value={b.id} /><button className={btnGhost}>Remove</button></form>
              </li>
            ))}
            {!blackouts?.length && <li className="py-2 text-neutral-500">No blocked periods.</li>}
          </ul>
          <p className="mt-4 text-xs text-neutral-500">Busy times on the connected Google Calendar are also hidden from the booking page automatically. Blocked times are entered in the business time zone.</p>
        </Card>
      </div>
    </>
  );
}
