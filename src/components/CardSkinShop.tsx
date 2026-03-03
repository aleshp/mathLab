import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Coins, Crown, CheckCircle, Sparkles, Lock } from 'lucide-react';
import { PlayerCard, CardSkin } from './card-skins/PlayerCard';
import { getPvPRank } from '../lib/gameLogic';

type Cosmetic = {
  id: string;
  name: string;
  type: string;
  image_url: string;
  price: number;
  is_premium: boolean;
};

// Визуальные метаданные скинов (описания, цвета, иконки)
const SKIN_META: Record<string, { desc: string; accent: string; icon: string }> = {
  default:  { desc: 'Классический стиль',          accent: 'from-slate-700 to-slate-800',   icon: '🎴' },
  electric: { desc: 'Электрические молнии',         accent: 'from-cyan-900 to-slate-900',    icon: '⚡' },
  fire:     { desc: 'Пылающая мощь',               accent: 'from-orange-900 to-slate-900',  icon: '🔥' },
  gold:     { desc: 'Легендарный статус',           accent: 'from-yellow-900 to-slate-900',  icon: '👑' },
};

const SKIN_BORDER: Record<string, string> = {
  default:  'border-slate-600',
  electric: 'border-cyan-500/60',
  fire:     'border-orange-500/60',
  gold:     'border-yellow-400/60',
};

const SKIN_GLOW: Record<string, string> = {
  default:  '',
  electric: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]',
  fire:     'shadow-[0_0_20px_rgba(249,115,22,0.35)]',
  gold:     'shadow-[0_0_25px_rgba(250,204,21,0.4)]',
};

const SKIN_BADGE: Record<string, string> = {
  default:  'bg-slate-700 text-slate-300',
  electric: 'bg-cyan-500/20 text-cyan-300',
  fire:     'bg-orange-500/20 text-orange-300',
  gold:     'bg-yellow-500/20 text-yellow-300',
};

export function CardSkinShop({ onClose }: { onClose: () => void }) {
  const { user, profile, refreshProfile } = useAuth();
  const [items, setItems] = useState<Cosmetic[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);

  const equippedSkin = profile?.equipped_card_skin || 'default';
  const [previewSkin, setPreviewSkin] = useState<CardSkin>(equippedSkin);
  const [activeSkin, setActiveSkin] = useState<CardSkin>(equippedSkin);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    if (!user) return;
    const { data: allItems } = await supabase.from('cosmetics').select('*').eq('type', 'card_skin');
    if (allItems) setItems(allItems);
    const { data: inventory } = await supabase.from('user_inventory').select('cosmetic_id').eq('user_id', user.id);
    if (inventory) setOwnedIds(new Set(inventory.map(i => i.cosmetic_id)));
    setLoading(false);
  }

  const buyItem = async (item: Cosmetic) => {
    if (!profile || profile.coins < item.price) { alert('Недостаточно монет!'); return; }
    if (item.is_premium && !profile.is_premium) { alert('Этот скин доступен только с Premium.'); return; }
    setBuying(item.id);
    const { error } = await supabase.rpc('buy_cosmetic', { item_id: item.id, user_id: user?.id, cost: item.price });
    if (!error) {
      setOwnedIds(prev => new Set(prev).add(item.id));
      await equipSkin(item.image_url);
    } else {
      alert('Ошибка покупки');
    }
    setBuying(null);
  };

  const equipSkin = async (skinId: string) => {
    if (!user) return;
    await supabase.from('profiles').update({ equipped_card_skin: skinId }).eq('id', user.id);
    setActiveSkin(skinId);
    setPreviewSkin(skinId);
    refreshProfile();
  };

  const pRank = getPvPRank(profile?.mmr || 1000);

  // Строим список: дефолт + из БД
  const allSkins = [
    { id: '__default', name: 'Стандартная', type: 'card_skin', image_url: 'default', price: 0, is_premium: false },
    ...items,
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-5xl h-[88vh] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">

        {/* Закрыть */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── ЛЕВАЯ: ПРЕДПРОСМОТР ── */}
        <div className="w-full md:w-[45%] bg-slate-900/60 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-slate-800/80 gap-6">

          {/* Заголовок превью */}
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-1">Предпросмотр</p>
            <p className="text-sm font-bold text-slate-300">
              {SKIN_META[previewSkin]?.icon} {allSkins.find(s => s.image_url === previewSkin)?.name ?? previewSkin}
            </p>
          </div>

          {/* Карточка */}
          <div className={`transition-all duration-300 ${SKIN_GLOW[previewSkin] ?? ''}`}>
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

          {/* Описание скина */}
          <p className="text-xs text-slate-500 italic text-center">
            {SKIN_META[previewSkin]?.desc ?? ''}
          </p>
        </div>

        {/* ── ПРАВАЯ: ВИТРИНА ── */}
        <div className="w-full md:w-[55%] flex flex-col h-full">

          {/* Шапка */}
          <div className="px-6 pt-5 pb-4 border-b border-slate-800/80 flex-shrink-0">
            <div className="flex items-start justify-between pr-10">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Скины карточки
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Выделись в каждом матче</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full w-fit">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 font-black text-sm">{profile?.coins ?? 0}</span>
              <span className="text-amber-600 text-xs">монет</span>
            </div>
          </div>

          {/* Список */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-slate-500 text-sm animate-pulse">
                Загрузка...
              </div>
            ) : allSkins.map(item => {
              const skinKey = item.image_url;
              const isOwned = item.id === '__default' || ownedIds.has(item.id);
              const isEquipped = activeSkin === skinKey;
              const isPreviewing = previewSkin === skinKey;
              const meta = SKIN_META[skinKey] ?? { desc: '', accent: 'from-slate-700 to-slate-800', icon: '🎴' };
              const canBuy = !item.is_premium || profile?.is_premium;

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setPreviewSkin(skinKey)}
                  onMouseLeave={() => setPreviewSkin(activeSkin)}
                  onClick={() => isOwned && equipSkin(skinKey)}
                  className={`
                    relative rounded-xl border overflow-hidden cursor-pointer
                    transition-all duration-200 group
                    ${isPreviewing
                      ? `${SKIN_BORDER[skinKey] ?? 'border-slate-600'} bg-slate-800/80`
                      : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/40'
                    }
                    ${isOwned ? 'cursor-pointer' : 'cursor-default'}
                  `}
                >
                  {/* Тонкий градиент-акцент слева */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${meta.accent} opacity-80`} />

                  <div className="flex items-center gap-4 px-4 py-3 pl-5">

                    {/* Иконка скина */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.accent} flex items-center justify-center text-xl flex-shrink-0 border ${SKIN_BORDER[skinKey] ?? 'border-slate-700'}`}>
                      {meta.icon}
                    </div>

                    {/* Название + описание */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-black text-white text-sm truncate">{item.name}</h4>
                        {item.is_premium && <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{meta.desc}</p>
                    </div>

                    {/* Кнопка действия */}
                    <div className="flex-shrink-0">
                      {isEquipped ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/40 rounded-lg">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300 text-xs font-black uppercase tracking-wide">Надето</span>
                        </div>
                      ) : isOwned ? (
                        <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-200 text-xs font-bold transition-colors">
                          Надеть
                        </button>
                      ) : !canBuy ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg opacity-60">
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-500 text-xs font-bold">Premium</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); buyItem(item); }}
                          disabled={buying === item.id || (profile?.coins ?? 0) < item.price}
                          className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all
                            ${(profile?.coins ?? 0) < item.price
                              ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-900/30 active:scale-95'
                            }
                          `}
                        >
                          {buying === item.id ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            <>
                              <Coins className="w-3.5 h-3.5" />
                              {item.price}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Индикатор — текущий превью */}
                  {isPreviewing && !isEquipped && (
                    <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${meta.accent}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Футер — подсказка */}
          <div className="px-6 py-3 border-t border-slate-800/80 flex-shrink-0">
            <p className="text-[10px] text-slate-600 text-center uppercase tracking-widest">
              Наведи на скин для предпросмотра
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}