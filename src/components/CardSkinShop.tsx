import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Coins, Crown, CheckCircle, Sparkles, Lock, Eye, ShoppingBag } from 'lucide-react';
import { PlayerCard, CardSkin } from './card-skins/PlayerCard';
import { getPvPRank } from '../lib/gameLogic';
import { usePvPStats } from '../hooks/usePvPStats';

type Cosmetic = {
  id: string;
  name: string;
  type: string;
  image_url: string;
  price: number;
  is_premium: boolean;
};

const SKIN_META: Record<string, { desc: string; accent: string }> = {
  default:  { desc: 'Классический стиль',   accent: 'from-slate-700 to-slate-800'   },
  electric: { desc: 'Электрические молнии', accent: 'from-cyan-900 to-slate-900'    },
  fire:     { desc: 'Пылающая мощь',        accent: 'from-orange-900 to-slate-900'  },
  gold:     { desc: 'Легендарный статус',   accent: 'from-yellow-900 to-slate-900'  },
  ice:      { desc: 'Кристальный холод',    accent: 'from-sky-900 to-slate-900'     },
  shadow:   { desc: 'Тьма поглощает всё',   accent: 'from-violet-950 to-slate-900'  },
  neon:     { desc: 'Матричный импульс',    accent: 'from-green-950 to-slate-900'   },
  plasma:   { desc: 'Нестабильная энергия', accent: 'from-fuchsia-950 to-slate-900' },
};

const SKIN_BORDER: Record<string, string> = {
  default: 'border-slate-600', electric: 'border-cyan-500/60', fire: 'border-orange-500/60',
  gold: 'border-yellow-400/60', ice: 'border-sky-300/60', shadow: 'border-violet-500/60',
  neon: 'border-green-400/60', plasma: 'border-fuchsia-400/60',
};

const SKIN_GLOW: Record<string, string> = {
  default: '', electric: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]',
  fire: 'shadow-[0_0_20px_rgba(249,115,22,0.35)]', gold: 'shadow-[0_0_25px_rgba(250,204,21,0.4)]',
  ice: 'shadow-[0_0_22px_rgba(125,211,252,0.35)]', shadow: 'shadow-[0_0_22px_rgba(139,92,246,0.4)]',
  neon: 'shadow-[0_0_20px_rgba(74,222,128,0.35)]', plasma: 'shadow-[0_0_28px_rgba(232,121,249,0.45)]',
};

export function CardSkinShop({ onClose }: { onClose: () => void }) {
  const { user, profile, refreshProfile } = useAuth();
  const [items, setItems]     = useState<Cosmetic[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading]  = useState(true);
  const [buying, setBuying]    = useState<string | null>(null);
  // Мобильный таб: 'shop' | 'preview'
  const [mobileTab, setMobileTab] = useState<'shop' | 'preview'>('shop');

  const equippedSkin = profile?.equipped_card_skin || 'default';
  const [previewSkin, setPreviewSkin] = useState<CardSkin>(equippedSkin);
  const [activeSkin,  setActiveSkin]  = useState<CardSkin>(equippedSkin);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    if (!user) return;
    const { data: allItems }  = await supabase.from('cosmetics').select('*').eq('type', 'card_skin');
    if (allItems) setItems(allItems);
    const { data: inventory } = await supabase.from('user_inventory').select('cosmetic_id').eq('user_id', user.id);
    if (inventory) setOwnedIds(new Set(inventory.map(i => i.cosmetic_id)));
    setLoading(false);
  }

  const buyItem = async (item: Cosmetic) => {
    if (!profile || profile.coins < item.price) { alert('Недостаточно монет!'); return; }
    if (item.is_premium && !profile.is_premium)  { alert('Этот скин доступен только с Premium.'); return; }
    setBuying(item.id);
    const { error } = await supabase.rpc('buy_cosmetic', { item_id: item.id, user_id: user?.id, cost: item.price });
    if (!error) { setOwnedIds(prev => new Set(prev).add(item.id)); await equipSkin(item.image_url); }
    else alert('Ошибка покупки');
    setBuying(null);
  };

  const equipSkin = async (skinId: string) => {
    if (!user) return;
    await supabase.from('profiles').update({ equipped_card_skin: skinId }).eq('id', user.id);
    setActiveSkin(skinId);
    setPreviewSkin(skinId);
    refreshProfile();
  };

  const pRank    = getPvPRank(profile?.mmr || 1000);
  const pvpStats = usePvPStats(user?.id);

  const allSkins = [
    { id: '__default', name: 'Стандартная', type: 'card_skin', image_url: 'default', price: 0, is_premium: false },
    ...items,
  ];

  // ── Список скинов (переиспользуется в обоих лейаутах) ──
  const SkinList = () => (
    <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2">
      {loading ? (
        <div className="flex items-center justify-center h-40 text-slate-500 text-sm animate-pulse">Загрузка...</div>
      ) : allSkins.map(item => {
        const skinKey     = item.image_url;
        const isOwned     = item.id === '__default' || ownedIds.has(item.id);
        const isEquipped  = activeSkin === skinKey;
        const isPreviewing = previewSkin === skinKey;
        const meta        = SKIN_META[skinKey] ?? { desc: '', accent: 'from-slate-700 to-slate-800' };
        const canBuy      = !item.is_premium || profile?.is_premium;

        return (
          <div
            key={item.id}
            onMouseEnter={() => setPreviewSkin(skinKey)}
            onMouseLeave={() => setPreviewSkin(activeSkin)}
            // На мобиле тап открывает превью
            onClick={() => {
              if (window.innerWidth < 768) {
                setPreviewSkin(skinKey);
                setMobileTab('preview');
              } else if (isOwned) {
                equipSkin(skinKey);
              }
            }}
            className={`
              relative rounded-xl border overflow-hidden cursor-pointer
              transition-all duration-200
              ${isPreviewing
                ? `${SKIN_BORDER[skinKey] ?? 'border-slate-600'} bg-slate-800/80`
                : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/40'
              }
            `}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${meta.accent} opacity-80`} />
            <div className="flex items-center gap-3 px-3 py-2.5 pl-4 md:px-4 md:py-3 md:pl-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-white text-sm truncate">{item.name}</h4>
                  {item.is_premium && <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">{meta.desc}</p>
              </div>

              <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                {isEquipped ? (
                  <div className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/20 border border-emerald-500/40 rounded-lg">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-300 text-xs font-black uppercase">Надето</span>
                  </div>
                ) : isOwned ? (
                  <button
                    onClick={() => equipSkin(skinKey)}
                    className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-200 text-xs font-bold transition-colors"
                  >
                    Надеть
                  </button>
                ) : !canBuy ? (
                  <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg opacity-60">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-500 text-xs font-bold">Premium</span>
                  </div>
                ) : (
                  <button
                    onClick={() => buyItem(item)}
                    disabled={buying === item.id || (profile?.coins ?? 0) < item.price}
                    className={`
                      flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black transition-all
                      ${(profile?.coins ?? 0) < item.price
                        ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-900/30 active:scale-95'
                      }
                    `}
                  >
                    {buying === item.id
                      ? <span className="animate-pulse px-1">...</span>
                      : <><Coins className="w-3 h-3" />{item.price}</>
                    }
                  </button>
                )}
              </div>
            </div>
            {isPreviewing && !isEquipped && (
              <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${meta.accent}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Превью карточки ──
  const PreviewPanel = () => (
    <div className="flex flex-col items-center justify-center gap-4 p-6 h-full">
      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-1">Предпросмотр</p>
        <p className="text-sm font-bold text-slate-300">
          {allSkins.find(s => s.image_url === previewSkin)?.name ?? previewSkin}
        </p>
      </div>
      <div className={`transition-all duration-300 ${SKIN_GLOW[previewSkin] ?? ''}`}>
        <PlayerCard
          isOpponent={false}
          name={profile?.username || 'Player'}
          mmr={profile?.mmr || 1000}
          rank={pRank}
          winRate={pvpStats.winRate}
          matchesPlayed={pvpStats.matchesPlayed}
          skin={previewSkin}
          stage="idle"
        />
      </div>
      <p className="text-xs text-slate-500 italic text-center">
        {SKIN_META[previewSkin]?.desc ?? ''}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 md:p-4 animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-5xl h-[95vh] md:h-[88vh] bg-slate-950 border border-slate-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden relative flex flex-col md:flex-row">

        {/* Закрыть */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── ДЕСКТОП: левая панель превью ── */}
        <div className="hidden md:flex w-[45%] bg-slate-900/60 flex-col border-r border-slate-800/80">
          <PreviewPanel />
        </div>

        {/* ── ДЕСКТОП: правая панель витрины ── */}
        <div className="hidden md:flex w-[55%] flex-col h-full">
          {/* Шапка */}
          <div className="px-6 pt-5 pb-4 border-b border-slate-800/80 flex-shrink-0">
            <div className="flex items-start justify-between pr-8">
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
          <SkinList />
          <div className="px-6 py-3 border-t border-slate-800/80 flex-shrink-0">
            <p className="text-[10px] text-slate-600 text-center uppercase tracking-widest">
              Наведи на скин для предпросмотра
            </p>
          </div>
        </div>

        {/* ── МОБАЙЛ: весь экран ── */}
        <div className="flex md:hidden flex-col h-full w-full">

          {/* Мобайл-шапка */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-800/80 flex-shrink-0 flex items-center justify-between pr-12">
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Скины карточки
              </h2>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 font-black text-sm">{profile?.coins ?? 0}</span>
            </div>
          </div>

          {/* Мобайл-табы */}
          <div className="flex border-b border-slate-800/80 flex-shrink-0">
            {[
              { key: 'shop',    icon: <ShoppingBag className="w-3.5 h-3.5" />, label: 'Магазин' },
              { key: 'preview', icon: <Eye className="w-3.5 h-3.5" />,         label: 'Предпросмотр' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setMobileTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black uppercase tracking-wider transition-colors
                  ${mobileTab === tab.key
                    ? 'text-white border-b-2 border-cyan-500'
                    : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          {/* Мобайл-контент */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {mobileTab === 'shop' ? (
              <>
                <div className="px-4 py-2 flex items-center justify-center gap-1.5 border-b border-slate-800/60 flex-shrink-0">
                  <span className="text-[10px] text-slate-600 uppercase tracking-widest">
                    Дабл-тап на скин для предпросмотра
                  </span>
                </div>
                <SkinList />
              </>
            ) : (
              <div className="overflow-y-auto flex-1"><PreviewPanel /></div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}