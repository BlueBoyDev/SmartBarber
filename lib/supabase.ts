import { createClient } from '@supabase/supabase-js';

// Buena Práctica: Asegurarnos de que las variables existan antes de inicializar la base de datos.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
