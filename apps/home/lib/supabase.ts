import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!supabaseUrl) throw new Error('SUPABASE_URL is not set');

// Server-only client — uses service role key, never exposed to the browser.
export const supabase = createClient(supabaseUrl, supabaseKey);
