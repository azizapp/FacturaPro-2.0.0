
import { createClient } from '@supabase/supabase-js';

// دالة متقدمة لجلب المتغيرات من أي مكان ممكن
const getEnv = (key: string): string => {
  // @ts-ignore
  const env = import.meta.env || {};
  // @ts-ignore
  const processEnv = typeof process !== 'undefined' ? process.env : {};
  
  return (
    env[`VITE_${key}`] || 
    env[key] || 
    processEnv[`VITE_${key}`] || 
    processEnv[key] || 
    window.localStorage.getItem(`SUPABASE_CUSTOM_${key}`) ||
    ''
  ).trim();
};

const initialUrl = getEnv('SUPABASE_URL');
const initialKey = getEnv('SUPABASE_ANON_KEY');

// التحقق من التهيئة
export const isSupabaseConfigured = () => {
  const url = getEnv('SUPABASE_URL');
  const key = getEnv('SUPABASE_ANON_KEY');
  return url.startsWith('http') && key.length > 10;
};

// إنشاء العميل مع دعم التحديث الديناميكي
const createSupabase = () => {
  const url = getEnv('SUPABASE_URL') || 'http://localhost:54321';
  const key = getEnv('SUPABASE_ANON_KEY') || 'placeholder-key';
  
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
};

export let supabase = createSupabase();

// دالة لتحديث الإعدادات يدوياً في حال فشل المتغيرات
export const updateSupabaseConfig = (url: string, key: string) => {
  window.localStorage.setItem('SUPABASE_CUSTOM_SUPABASE_URL', url);
  window.localStorage.setItem('SUPABASE_CUSTOM_SUPABASE_ANON_KEY', key);
  supabase = createSupabase();
  return isSupabaseConfigured();
};
