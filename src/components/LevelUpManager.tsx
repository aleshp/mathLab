import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LevelUpModal } from './LevelUpModal';
import { getRank, getPvPRank } from '../lib/gameLogic';

export function LevelUpManager() {
  const { profile } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<{ type: 'level' | 'pvp', title: string, icon: any } | null>(null);

  const prevLevelRef = useRef<number | null>(null);
  const prevMMRRef = useRef<number | null>(null);

  useEffect(() => {
    if (!profile) return;

    const currentLevel = profile.clearance_level;
    const currentMMR = profile.mmr || 1000;

    // === 1. ПРОВЕРКА УРОВНЯ ===
    if (prevLevelRef.current !== null) {
      if (currentLevel > prevLevelRef.current) {
        const oldRank = getRank(prevLevelRef.current, profile.is_admin);
        const newRank = getRank(currentLevel, profile.is_admin);

        if (oldRank.title !== newRank.title) {
          setModalData({
            type: 'level',
            title: newRank.title,
            icon: newRank.icon
          });
          setShowModal(true);
        }
      }
    }

    // === 2. ПРОВЕРКА PVP РАНГА ===
    if (prevMMRRef.current !== null) {
      if (currentMMR > prevMMRRef.current) {
        const oldPvPRank = getPvPRank(prevMMRRef.current);
        const newPvPRank = getPvPRank(currentMMR);

        // Сравниваем по fullName, а не по ссылке на объект
        if (oldPvPRank.fullName !== newPvPRank.fullName) {
          setModalData({
            type: 'pvp',
            title: newPvPRank.fullName, // ✅ строка, не объект
            icon: null
          });
          setShowModal(true);
        }
      }
    }

    prevLevelRef.current = currentLevel;
    prevMMRRef.current = currentMMR;
  }, [profile]);

  if (!showModal || !modalData) return null;

  return (
    <LevelUpModal
      type={modalData.type}
      newTitle={modalData.title}
      icon={modalData.icon}
      onClose={() => setShowModal(false)}
    />
  );
}