import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Lock, Coins, Crown, CheckCircle } from 'lucide-react';
import { PlayerCard, CardSkin } from './card-skins/PlayerCard';
import { getPvPRank } from '../lib/gameLogic';

type Cosmetic = {
  id: string;
  name: string;
  type: string;
  image_url: string; // Тут лежит название скина (electric, fire, gold)
  price: number;
  is_premium: boolean;
};

export function CardSkinShop({ onClose }: { onClose: () => void }) {
  const { user, profile, refreshProfile } = useAuth();
  const [items, setItems] = useState<Cosmetic[]>([]);
  const[ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Для предпросмотра
  const [previewSkin, setPreviewSkin] = useState<CardSkin>(profile?.equipped_card_skin || 'default');

  useEffect(() => {
    loadData();
  },[]);

  async function loadData() {
    if (!user) return;
    
    // Грузим только скины карточек
    const { data: allItems } = await supabase.from('cosmetics').select('*').eq('type', 'card_skin');
    if (allItems) setItems(allItems);

    // Инвентарь
    const { data: inventory } = await supabase.from('user_inventory').select('cosmetic_id').eq('user_id', user.id);
    if (inventory) {
      setOwnedIds(new Set(inventory.map(i => i.cosmetic_id)));
    }
    setLoading(false);
  }

  const buyItem = async (item: Cosmetic) => {
    if (!profile || profile.coins < item.price) {
      alert("Недостаточно монет!");
      return;
    }
    if (item.is_premium && !profile.is_premium) {
      alert("Этот скин доступен только пользователям с Premium.");
      return;
    }

    const { error } = await supabase.rpc('buy_cosmetic', { 
      item_id: item.id, 
      user_id: user?.id, 
      cost: item.price 
    });

    if (!error) {
      setOwnedIds(prev => new Set(prev).add(item.id));
      equipItem(item.image_url);
    } else {
      alert("Ошибка покупки");
    }
  };

  const equipItem = async (skinId: string) => {
    if (!user) return;
    await supabase.from('profiles').update({ equipped_card_skin: skinId }).eq('id', user.id);
    setPreviewSkin(skinId);
    refreshProfile();
  };

  const pRank = getPvPRank(profile?.mmr || 1000);

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
        
        <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        {/* ЛЕВАЯ ЧАСТЬ: ПРЕДПРОСМОТР КАРТОЧКИ */}
        <div className="w-full md:w-1/2 bg-slate-950 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-slate-800">
          <h3 className="text-slate-400 font-mono text-xs uppercase tracking-widest mb-6">Предпросмотр</h3>
          <div className="scale-90 md:scale-100">
            <PlayerCard 
              isOpponent={false} 
              name={profile?.username || 'Player'} 
              mmr={profile?.mmr || 1000} 
              rank={pRank} 
              winRate={profile?.success_rate || 0} 
              skin={previewSkin} 
              stage="idle"
            />
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: ВИТРИНА */}
        <div className="w-full md:w-1/2 flex flex-col h-full bg-slate-900">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Стиль карточки</h2>
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-bold">{profile?.coins || 0}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
            {/* Базовый скин (всегда доступен) */}
            <div 
              onMouseEnter={() => setPreviewSkin('default')}
              onMouseLeave={() => setPreviewSkin(profile?.equipped_card_skin || 'default')}
              className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${previewSkin === 'default' ? 'bg-slate-800 border-slate-600' : 'bg-slate-900 border-slate-800 hover:bg-slate-800/50'}`}
            >
              <div>
                <h4 className="font-bold text-white">Стандартная</h4>
                <p className="text-xs text-slate-500">Базовый дизайн</p>
              </div>
              <button 
                onClick={() => equipItem('default')}
                className={`px-4 py-2 rounded-lg text-sm font-bold ${profile?.equipped_card_skin === 'default' || !profile?.equipped_card_skin ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
              >
                {(profile?.equipped_card_skin === 'default' || !profile?.equipped_card_skin) ? 'Надето' : 'Надеть'}
              </button>
            </div>

            {loading ? <div className="text-center text-slate-500 pt-10">Загрузка витрины...</div> : items.map(item => {
              const isOwned = ownedIds.has(item.id);
              const isEquipped = profile?.equipped_card_skin === item.image_url;

              return (
                <div 
                  key={item.id}
                  onMouseEnter={() => setPreviewSkin(item.image_url)}
                  onMouseLeave={() => setPreviewSkin(profile?.equipped_card_skin || 'default')}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${previewSkin === item.image_url ? 'bg-slate-800 border-slate-600' : 'bg-slate-900 border-slate-800 hover:bg-slate-800/50'}`}
                >
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-2">
                      {item.name}
                      {item.is_premium && <Crown className="w-3 h-3 text-amber-400" />}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{item.price > 0 ? `${item.price} монет` : 'Эксклюзив'}</p>
                  </div>

                  {isOwned ? (
                    <button 
                      onClick={() => equipItem(item.image_url)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold ${isEquipped ? 'bg-emerald-600 text-white flex items-center gap-2' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                      {isEquipped ? <><CheckCircle className="w-4 h-4"/> Надето</> : 'Надеть'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => buyItem(item)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-amber-900/20"
                    >
                      <Coins className="w-4 h-4" /> {item.price > 0 ? item.price : 'Получить'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}