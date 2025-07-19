// vite.config
import { defineConfig } from 'vite';
import { createClient } from '@supabase/supabase-js';

export default defineConfig({
  base: '/MovieZ/', // must match your repo name
  // ...other config
});
