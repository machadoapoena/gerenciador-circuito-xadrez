
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nhuwgjjiqwxbsoutpmua.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LRHPEgIs3PTienTVeQHCcg_0t5fy2FY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
