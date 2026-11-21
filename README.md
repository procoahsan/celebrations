# The Celebrations

An immersive, cinematic website for The Celebrations, built with Next.js (App Router), React Three Fiber, custom GLSL, GSAP ScrollTrigger and Lenis. Supabase, Resend, Google Calendar/Meet and Instagram power the business side. Art direction is documented in [`docs/ART-DIRECTION.md`](docs/ART-DIRECTION.md).

## Run

```bash
npm install
cp .env.example .env.local   # fill in what you have; everything degrades gracefully
npm run dev
```

Without any environment variables the public site runs fully on the supplied launch media. Forms answer honestly that online submission isn't connected yet, and the admin portal shows setup instructions.

## Windows quick start and admin login

In PowerShell, from this project folder, run:

```powershell
npm install
Copy-Item .env.example .env.local # only if .env.local does not already exist
npm run dev
```

Open http://localhost:3000. Stop the server with Ctrl+C. Node.js and npm must be installed. The public site works with blank integration values, but online forms and admin require the services described below.

To enable the admin portal:

1. Create a Supabase project. In its SQL Editor, run `supabase/migrations/20261121_celebrations06.sql` followed by `supabase/migrations/20261122_experience.sql`.
2. In Supabase Authentication, create an email/password user and copy its user ID. If email confirmation is required, confirm the user before signing in.
3. In the SQL Editor, authorize that user (replace the UUID with the user ID):

   ```sql
   insert into public.admin_users (user_id) values ('YOUR-USER-UUID');
   ```

4. In `.env.local`, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the project URL and publishable key from Supabase. Set `SUPABASE_SERVICE_ROLE_KEY` as well for server-side forms and integrations; keep it secret and never prefix it with `NEXT_PUBLIC_`.
5. Restart `npm run dev`, open http://localhost:3000/admin/login, and sign in with the email and password created above. There is no default admin password. The other environment values enable optional email and external integrations.

The launch portfolio uses supplied archive media until an admin publishes a database project. Once a project is published, the database portfolio replaces the launch portfolio, so add all desired media in Admin → Portfolio before publishing.

## Homepage chapters

| # | Chapter | Implementation |
| --- | --- | --- |
| 01 | Opening | R3F scene: three arched **video portals** using a custom `DistortionMaterial` (pointer ripple, scroll-velocity bend, noise reveal, arch SDF mask with gilt rim), a `MeshReflectorMaterial` floor on capable GPUs, `Noise` + `Vignette` post-processing, pointer camera parallax, and a pinned ScrollTrigger that dollies the camera through the centre portal into an ivory arch |
| 02 | Transformation | Pinned, scrubbed 96-frame canvas image sequence from the business's own aisle setup timelapse; the frame grows from an arch to full bleed while the type moves through three phases |
| 03 | Gallery | R3F curved exhibition wall (`ImmersiveGallery`): scroll and drag rotate it, the active work comes forward, neighbours dim and desaturate, shader hover distortion, click opens the project |
| 04 | Art of Celebration | Pinned category sequence; `ImageTransitionMaterial` noise-dissolve morphs, atmosphere colour and masked type per category |
| 05 | Event Studio | Theme selector with a shader morph leads into `/design-your-event` |
| 06 | Behind the Magic | Pinned four-step story (Imagine, Create, Transform, Celebrate) from real setup videos, with arch-masked transitions and a full-screen reveal |
| 07 | Client Stories | Approved Instagram testimonials only; an honest empty state otherwise |
| 08 | Invitation | A small arch expands into a full-bleed candlelit video; the closing CTAs follow |

Global pieces: Lenis on the GSAP ticker, a velvet curtain page transition (`Curtain` + `TransitionLink`), a full-screen menu, a precise-pointer cursor, SplitText reveals, adaptive DPR and quality tiers, and a WebGL fallback for every scene. Reduced motion is respected throughout.

## Event Studio (`/design-your-event`)

- **Moodboard (React Konva):** templates, event type and style, an editable palette, backgrounds, a decor library (arch, florals, candles, drape, sofa, tables, runner, lantern, crystal hanging, text), drag, resize and rotate with a Transformer, layers, duplicate and delete, keyboard nudging, undo/redo, reference image uploads, JPEG export, and a local draft.
- **3D concept (R3F):** a stylized, palette-driven scene built from primitives and instanced blooms, with orbit and zoom, ceremony/stage/banquet arrangements, golden/candlelit/daylight lighting and décor toggles. It is labelled as not to scale.
- **Submission:** contact details, date, location, guests, budget, concept and requests, the full configuration JSON, the board preview, a 3D snapshot and references. Images go to the private `submissions` bucket, the row goes to `event_design_submissions`, and the client gets a Resend acknowledgement while the team gets an alert.

## Backend setup

1. Create a Supabase project and run `supabase/migrations/*.sql` in order.
2. Create an admin user in Supabase Auth, then run `insert into public.admin_users (user_id) values ('<auth user id>');`
3. Fill in `.env.local`. Visit `/admin/integrations` to connect Google (Calendar + Meet) and Instagram.
4. In Admin, add portfolio projects, categories and templates. Published database content replaces the launch content automatically.

| Integration | What it does |
| --- | --- |
| Supabase | Content, portfolio, submissions, bookings (an exclusion constraint prevents double booking), testimonials, availability, encrypted OAuth tokens, storage |
| Resend | Client confirmations and team notifications for studio concepts, bookings and inquiries |
| Google | OAuth (offline) → free/busy filtering of slots and calendar events with real **Google Meet** links; cancelling in admin cancels the event |
| Instagram | Meta Graph API via Facebook Login; comment import and a signed webhook (`/api/instagram/webhook`) create **pending** testimonials for moderation |

## Media

`node scripts/prepare-media.mjs` regenerates `public/media` from the WhatsApp originals (requires the `ffmpeg-static` dev dependency). See `ASSET-MANIFEST.md`.
