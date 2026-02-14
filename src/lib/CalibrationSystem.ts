import { supabase } from './supabase';

export interface CalibrationState {
  isCalibrating: boolean;
  matchesPlayed: number;
  totalMatches: number;
  provisionalMMR: number;
  results: boolean[];
}

const CALIBRATION_MATCHES = 5;

// === ЗАПИСАТЬ РЕЗУЛЬТАТ (Через RPC - Серверная функция) ===
export async function recordCalibrationMatch(
  userId: string,
  won: boolean,
  opponentMMR: number
): Promise<CalibrationState | null> {
  
  try {
    // Вызываем SQL функцию, которую создали в Шаге 1
    const { data, error } = await supabase.rpc('record_calibration_match', {
      user_id: userId,
      is_win: won,
      opponent_mmr: opponentMMR
    });

    if (error) {
      console.error('RPC Error (Calibration):', error);
      throw error;
    }

    // Возвращаем обновленное состояние для UI
    return {
      isCalibrating: !data.is_finished,
      matchesPlayed: data.matches_played,
      totalMatches: CALIBRATION_MATCHES,
      provisionalMMR: data.new_mmr,
      results: [] // Историю результатов в UI обычно не показываем детально
    };

  } catch (err) {
    console.error("Failed to record calibration match:", err);
    return null;
  }
}

// === ПОЛУЧИТЬ СТАТУС ===
export async function getCalibrationStatus(userId: string): Promise<CalibrationState | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_calibrating, calibration_matches_played, calibration_results, mmr, has_calibrated')
    .eq('id', userId)
    .single();

  if (error || !profile) return null;

  if (!profile.has_calibrated && !profile.is_calibrating) {
    // Если еще не начинал
    return {
      isCalibrating: false,
      matchesPlayed: 0,
      totalMatches: CALIBRATION_MATCHES,
      provisionalMMR: 1000,
      results: []
    };
  }

  return {
    isCalibrating: profile.is_calibrating || false,
    matchesPlayed: profile.calibration_matches_played || 0,
    totalMatches: CALIBRATION_MATCHES,
    provisionalMMR: profile.mmr || 1000,
    results: profile.calibration_results || []
  };
}

// Функции startCalibration и resetCalibration можно удалить или оставить пустыми,
// так как основная логика теперь внутри record_calibration_match.
export async function startCalibration(userId: string): Promise<void> {
    // Опционально: сброс перед началом, если нужно
    await supabase.from('profiles').update({
        is_calibrating: true,
        calibration_matches_played: 0,
        has_calibrated: false
    }).eq('id', userId);
}