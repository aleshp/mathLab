import { supabase } from './supabase';

export const trackEvent = async (userId: string, event: string, metadata: any = {}) => {
  try {
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: event,
      metadata: metadata
    });
  } catch (e) {
    console.error('Analytics Error:', e);
  }
};