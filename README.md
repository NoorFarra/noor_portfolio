# Noor Farra Portfolio

Personal portfolio for Noor Farra, Software Developer. The public interface uses a custom editorial design with Manrope and Instrument Serif, a dark green palette, real project screenshots, current education and training, and the approved one-page CV.

## Build and preview

```sh
pnpm install --frozen-lockfile
pnpm run build
python -m http.server 5500 --directory dist
```

Open `http://localhost:5500`. Vercel uses the same build and publishes `dist/`.
Tailwind CSS 3.4.17 is compiled at build time; the public site does not use the Tailwind runtime CDN. Login and dashboard retain their existing stylesheet.

## Content and CV

- `index.html`: accessible public content, matching the approved CV.
- `js/project-data.js`: metadata for S2 TURBO, Bikhtisar, and Wajehti.
- `assets/Noor_Farra_CV.pdf`: approved downloadable CV, available from the hero and resume card.
- `assets/projects/`: screenshots of the actual projects.
- `src/portfolio.css` and `tailwind.config.cjs`: reference design tokens and responsive styling.
- `js/portfolio.js`: navigation, persistent color mode, email copy, and published Supabase projects.

The three current projects are rendered in the initial HTML. If Supabase is unavailable, visitors can still browse them and download the CV. Once connected, published project records are loaded from Supabase. Project image and link URLs are restricted to HTTP(S), and database text is assigned as text rather than executable markup.

## Dedicated Supabase project

Use a new dedicated project. Do not run the initial schema on the paused legacy project or on the automotive or news projects.

1. Apply the files in `supabase/migrations/` in chronological order to a new project. `supabase-setup.sql` contains the initial schema for the SQL Editor; use it instead of the initial migration, once.
2. Apply `supabase-seed.sql` to add the three CV projects. It is safe to rerun.
3. Set the new public project URL and publishable key in `js/config.js`. Never put secret or service-role keys in browser code.
4. Create the owner's application login through Supabase Authentication, using credentials chosen by the owner. Account credentials are not copied from the old paused project.
5. Through the trusted SQL Editor, add that user's UUID to `public.portfolio_admins`:

   ```sql
   insert into public.portfolio_admins (user_id)
   values ('OWNER_AUTH_USER_UUID')
   on conflict (user_id) do nothing;
   ```

6. Verify anonymous project reads and administrator login, upload, and edit access.

RLS allows visitors to read published projects and public project images. Only the administrator allowlist can write project records or images. The allowlist itself cannot be edited by public or authenticated API clients. The image bucket accepts JPEG, PNG, WebP, and AVIF up to 5 MB.

The contact section uses the real public email address and phone number. It does not submit email automatically. Existing EmailJS configuration is retained for compatibility with the previous source.

The dedicated project currently configured is `hzrsneyogjpobnqjaeim`. Browser code uses its publishable key; privileged keys are not included.
