import { supabase, getCurrentUserId } from './client';
import type { UserPreferences } from '@/types';
import { DEFAULT_PALETTE_ID } from '@/types';

/**
 * Fetch the current user's preferences
 * Creates default preferences if none exist
 */
export async function fetchPreferences(): Promise<UserPreferences> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  // If no preferences exist, create defaults
  if (!data) {
    return createDefaultPreferences(userId);
  }

  return data;
}

/**
 * Create default preferences for a user
 */
async function createDefaultPreferences(userId: string): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .insert({
      user_id: userId,
      current_palette: DEFAULT_PALETTE_ID,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update the current user's palette preference
 */
export async function updatePalette(paletteId: string): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        current_palette: paletteId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) throw error;
}
