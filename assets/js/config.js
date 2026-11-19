// ─────────────────────────────────────────────────────────────
// Connect the app to your Supabase project.
// Supabase → open your project → "Connect" button (top bar), or Settings → API Keys:
//   copy the Project URL and the PUBLISHABLE key (starts with sb_publishable_…).
//   (An older "anon" key starting with eyJ… also works, but Supabase is retiring those.)
// Never paste the SECRET key (sb_secret_… / service_role) here.
// The publishable key is designed to be public: all data is protected by the
// row-level-security rules in supabase/01_schema.sql.
// ─────────────────────────────────────────────────────────────
export const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR-PUBLISHABLE-KEY';
