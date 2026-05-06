# Noor Portfolio - Supabase + EmailJS

## 1) Supabase

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase-setup.sql`.
4. Run `supabase-seed.sql` if you want sample projects.
5. Create an auth user from Authentication > Users.
6. Add your keys in `js/config.js`:

```js
export const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
export const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";
export const STORAGE_BUCKET = "project-images";
```

## 2) EmailJS contact form

1. Create an EmailJS account.
2. Add an Email Service.
3. Create an Email Template.
4. In the template, use these variables:

```txt
{{from_name}}
{{from_email}}
{{message}}
{{to_name}}
```

5. Add your EmailJS keys in `js/config.js`:

```js
export const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
export const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
export const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
```

## 3) Run locally

Do not open the HTML file directly. Use Live Server or:

```bash
python -m http.server 5500
```

Then open:

```txt
http://localhost:5500
```

## Important

- `index.html` is static except the projects container and the contact form logic.
- Projects come from Supabase.
- Dashboard is protected by Supabase Auth.
- Contact form sends via EmailJS.
