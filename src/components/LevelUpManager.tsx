import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LevelUpModal } from './LevelUpModal';
import { RankUpModal } from './RankUpModal';
import { DerankModal } from './DerankModal';
import { CalibrationRevealModal } from './CalibrationRevealModal';
import { getRank, getPvPRank } from '../lib/gameLogic';

type ModalState =
  | { type: 'level'; title: string; icon: any }
  | { type: 'rankup'; newRank: any; oldMMR: number; newMMR: number }
  | { type: 'derank'; newRank: any; oldMMR: number; newMMR: number }
  | { type: 'calibration'; finalMMR: number; finalRank: any };

export function LevelUpManager() {
  const { profile } = useAuth();

  const [modal, setModal] = useState<ModalState | null>(null);

  const prevLevelRef = useRef<number | null>(null);
  const prevMMRRef = useRef<number | null>(null);
  const prevCalibratedRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!profile) return;

    const currentLevel = profile.clearance_level;
    const currentMMR = profile.mmr || 1000;
    const hasCalibratedNow = profile.has_calibrated ?? false;

    // === 1. CALIBRATION REVEAL (highest priority) ===
    if (prevCalibratedRef.current === false && hasCalibratedNow) {
      const rank = getPvPRank(currentMMR);
      setModal({ type: 'calibration', finalMMR: currentMMR, finalRank: rank });
      prevCalibratedRef.current = hasCalibratedNow;
      prevMMRRef.current = currentMMR;
      prevLevelRef.current = currentLevel;
      return;
    }

    // === 2. LEVEL UP ===
    if (prevLevelRef.current !== null && currentLevel > prevLevelRef.current) {
      const oldRank = getRank(prevLevelRef.current, profile.role === 'admin');
      const newRank = getRank(currentLevel, profile.role === 'admin');
      if (oldRank.title !== newRank.title) {
        setModal({ type: 'level', title: newRank.title, icon: newRank.icon });
      }
    }

    // === 3. RANK UP / DERANK (only if calibrated) ===
    if (hasCalibratedNow && prevMMRRef.current !== null) {
      const oldPvPRank = getPvPRank(prevMMRRef.current);
      const newPvPRank = getPvPRank(currentMMR);

      if (oldPvPRank.name !== newPvPRank.name) {
        if (currentMMR > prevMMRRef.current) {
          // Rank up
          setModal({
            type: 'rankup',
            newRank: newPvPRank,
            oldMMR: prevMMRRef.current,
            newMMR: currentMMR,
          });
        } else {
          // Derank
          setModal({
            type: 'derank',
            newRank: newPvPRank,
            oldMMR: prevMMRRef.current,
            newMMR: currentMMR,
          });
        }
      }
    }

    prevLevelRef.current = currentLevel;
    prevMMRRef.current = currentMMR;
    prevCalibratedRef.current = hasCalibratedNow;
  }, [profile]);

  if (!modal) return null;

  const close = () => setModal(null);

  if (modal.type === 'level') {
    return <LevelUpModal type="level" newTitle={modal.title} icon={modal.icon} onClose={close} />;
  }

  if (modal.type === 'rankup') {
    return <RankUpModal newRank={modal.newRank} oldMMR={modal.oldMMR} newMMR={modal.newMMR} onClose={close} />;
  }

  if (modal.type === 'derank') {
    return <DerankModal newRank={modal.newRank} oldMMR={modal.oldMMR} newMMR={modal.newMMR} onClose={close} />;
  }

  if (modal.type === 'calibration') {
    return <CalibrationRevealModal finalMMR={modal.finalMMR} finalRank={modal.finalRank} onClose={close} />;
  }

  return null;
}