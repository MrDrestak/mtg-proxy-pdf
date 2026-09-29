import { useState, useCallback, useEffect } from 'react';
import {
  loadWatermarkSettings,
  saveWatermarkSettings
} from '../services/watermarkSettingsService';

interface WatermarkSettings {
  opacity: number;
  scale: number;
  showWatermark: boolean;
}

interface UseWatermarkSettingsReturn {
  watermarkOpacity: number;
  watermarkScale: number;
  showWatermark: boolean;
  loading: boolean;
  error: Error | null;
  updateOpacity: (value: number) => Promise<void>;
  updateScale: (value: number) => Promise<void>;
  updateShowWatermark: (value: boolean) => Promise<void>;
  updateSettings: (settings: Partial<WatermarkSettings>) => Promise<void>;
}

const DEFAULT_SETTINGS: WatermarkSettings = {
  opacity: 35,
  scale: 100,
  showWatermark: true
};

export function useWatermarkSettings(): UseWatermarkSettingsReturn {
  const [settings, setSettings] = useState<WatermarkSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const loaded = await loadWatermarkSettings();
        setSettings(loaded);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load settings');
        setError(error);
        console.error('Failed to load watermark settings:', error);
        // Fall back to defaults
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Update opacity
  const updateOpacity = useCallback(async (value: number) => {
    try {
      const newSettings = { ...settings, opacity: value };
      await saveWatermarkSettings(newSettings);
      setSettings(newSettings);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save opacity');
      setError(error);
      console.error('Failed to update opacity:', error);
      throw error;
    }
  }, [settings]);

  // Update scale
  const updateScale = useCallback(async (value: number) => {
    try {
      const newSettings = { ...settings, scale: value };
      await saveWatermarkSettings(newSettings);
      setSettings(newSettings);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save scale');
      setError(error);
      console.error('Failed to update scale:', error);
      throw error;
    }
  }, [settings]);

  // Update showWatermark
  const updateShowWatermark = useCallback(async (value: boolean) => {
    try {
      const newSettings = { ...settings, showWatermark: value };
      await saveWatermarkSettings(newSettings);
      setSettings(newSettings);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save watermark visibility');
      setError(error);
      console.error('Failed to update watermark visibility:', error);
      throw error;
    }
  }, [settings]);

  // Update multiple settings at once
  const updateSettings = useCallback(async (updates: Partial<WatermarkSettings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      await saveWatermarkSettings(newSettings);
      setSettings(newSettings);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save settings');
      setError(error);
      console.error('Failed to update settings:', error);
      throw error;
    }
  }, [settings]);

  return {
    watermarkOpacity: settings.opacity,
    watermarkScale: settings.scale,
    showWatermark: settings.showWatermark,
    loading,
    error,
    updateOpacity,
    updateScale,
    updateShowWatermark,
    updateSettings
  };
}
