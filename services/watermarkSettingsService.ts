import { createClient } from '@supabase/supabase-js';

interface WatermarkSettings {
  opacity: number;
  scale: number;
  showWatermark: boolean;
}

const DEFAULT_SETTINGS: WatermarkSettings = {
  opacity: 35,
  scale: 100,
  showWatermark: true
};

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = () => !!(supabaseUrl && supabaseKey);

const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }
  return createClient(supabaseUrl, supabaseKey);
};

// LocalStorage fallback
const LOCAL_STORAGE_KEY = 'mtg_watermark_settings';

/**
 * Load watermark settings from Supabase or localStorage
 */
export async function loadWatermarkSettings(): Promise<WatermarkSettings> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('watermark_settings')
        .select('opacity, scale, show_watermark')
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found, which is expected for first load
        throw error;
      }

      if (data) {
        return {
          opacity: data.opacity,
          scale: data.scale,
          showWatermark: data.show_watermark
        };
      }

      // No data found, return defaults
      return DEFAULT_SETTINGS;
    }
  } catch (err) {
    console.warn('Failed to load from Supabase, falling back to localStorage:', err);
  }

  // Fall back to localStorage
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.warn('Failed to load from localStorage:', err);
  }

  return DEFAULT_SETTINGS;
}

/**
 * Save watermark settings to Supabase and localStorage
 */
export async function saveWatermarkSettings(settings: WatermarkSettings): Promise<void> {
  // Always save to localStorage as backup
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }

  // Try to save to Supabase
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, using localStorage only');
    return;
  }

  try {
    const supabase = getSupabaseClient();

    // Check if record exists
    const { data: existingData } = await supabase
      .from('watermark_settings')
      .select('id')
      .single();

    if (existingData) {
      // Update existing record
      const { error } = await supabase
        .from('watermark_settings')
        .update({
          opacity: settings.opacity,
          scale: settings.scale,
          show_watermark: settings.showWatermark,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id);

      if (error) {
        throw error;
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('watermark_settings')
        .insert({
          opacity: settings.opacity,
          scale: settings.scale,
          show_watermark: settings.showWatermark,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }
    }
  } catch (err) {
    console.error('Failed to save watermark settings to Supabase:', err);
    throw err;
  }
}
