
import { createClient } from '@supabase/supabase-js';

/**
 * Récupération des variables d'environnement avec support des préfixes VITE_ 
 * (standard Vite) et sans préfixe (standard Railway/CI).
 */
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

/**
 * Le SDK Supabase lève une erreur fatale si createClient est appelé avec une chaîne vide.
 * On utilise des placeholders pour permettre au bundle de charger sans crasher 
 * l'intégralité de l'interface utilisateur.
 */
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Configuration Supabase manquante ou incomplète.\n" +
    "Assurez-vous d'avoir défini VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans vos variables d'environnement.\n" +
    "L'application tentera de fonctionner en mode dégradé."
  );
}

export const supabase = createClient(finalUrl, finalKey);
