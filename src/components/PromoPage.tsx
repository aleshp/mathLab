import React from 'react';
import { CinematicTrailer } from './CinematicTrailer';

export function PromoPage() {
  const goToMain = () => {
    window.location.href = '/'; // Кидаем на главную после просмотра или клика
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <CinematicTrailer 
        onClose={goToMain} 
        onAction={goToMain} 
      />
    </div>
  );
}