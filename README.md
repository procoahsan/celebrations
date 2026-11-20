# Celebrations06

An asset-led, cinematic public site for Celebrations06. The supplied WhatsApp photos and video assets are unpacked in `public/media/`, while a curated selection is served from `dist/media/` for the static experience.

## Current public experience

- Cinematic video hero and behind-the-scenes chapter
- Responsive project portfolio using supplied event photos
- Interactive visual concept board with draggable floral/table elements and palette choices
- Consultation date/time preference interface in `Asia/Karachi`
- Contact and inquiry interfaces

The local interfaces intentionally state that they are previews where live functionality would require configuration. They do not claim to submit messages, reserve times, create Meet links, or email customers.

## Production integration

The included schema in `supabase/migrations/20261121_celebrations06.sql` establishes core tables for portfolio, inquiries, visual design submissions, and consultation bookings. A Next.js server layer should use the variables in `.env.example` to:

1. Validate and persist public form submissions with Zod.
2. Enforce authenticated admin-only writes and reads with Supabase RLS plus server-side role checks.
3. Create Google Calendar events and Meet conferences only after a successful server-side availability check.
4. Send Resend notifications from a verified domain.
5. Store the event-designer JSON and preview image in Supabase Storage.

No credentials are included, and no third-party service is represented as connected.
