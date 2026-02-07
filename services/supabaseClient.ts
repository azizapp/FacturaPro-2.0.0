
import { createClient } from '@supabase/supabase-js';

// Utilisation de process.env au lieu de import.meta.env pour éviter l'erreur "undefined"
// dans cet environnement d'exécution spécifique.
const supabaseUrl = (process.env as any).VITE_SUPABASE_URL || '';
const supabaseAnonKey = (process.env as any).VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Les identifiants Supabase sont manquants dans process.env. Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
