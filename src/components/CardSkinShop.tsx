import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Coins, Crown, CheckCircle, Sparkles, Lock, Eye, ShoppingBag, Trophy } from 'lucide-react';
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
  _isOwned?: boolean;
};

const SKIN_META: Record<string, { desc: string; accent: string }> = {
  default:  { desc: 'Классический стиль',            accent: 'from-slate-700 to-slate-800'    },
  electric: { desc: 'Электрические молнии',           accent: 'from-cyan-900 to-slate-900'     },
  fire:     { desc: 'Пылающая мощь',                  accent: 'from-orange-900 to-slate-900'   },
  gold:     { desc: 'Легендарный статус',             accent: 'from-yellow-900 to-slate-900'   },
  ice:      { desc: 'Кристальный холод',              accent: 'from-sky-900 to-slate-900'      },
  shadow:   { desc: 'Тьма поглощает всё',             accent: 'from-violet-950 to-slate-900'   },
  neon:     { desc: 'Матричный импульс',              accent: 'from-green-950 to-slate-900'    },
  plasma:   { desc: 'Нестабильная энергия',           accent: 'from-fuchsia-950 to-slate-900'  },
  warlord:  { desc: '#1 PvP — Военачальник арены',    accent: 'from-red-900 to-slate-900'      },
  sage:     { desc: '#1 Опыт — Великий Мудрец',       accent: 'from-cyan-900 to-slate-900'     },
  absolute: { desc: '#1 Общий — Абсолютный чемпион',  accent: 'from-yellow-800 to-slate-900'   },
};

const SKIN_BORDER: Record<string, string> = {
  default:  'border-slate-600',
  electric: 'border-cyan-500/60',
  fire:     'border-orange-500/60',
  gold:     'border-yellow-400/60',
  ice:      'border-sky-300/60',
  shadow:   'border-violet-500/60',
  neon:     'border-green-400/60',
  plasma:   'border-fuchsia-400/60',
  warlord:  'border-red-600/70',
  sage:     'border-cyan-400/70',
  absolute: 'border-yellow-400/80',
};

const SKIN_GLOW: Record<string, string> = {
  default:  '',
  electric: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]',
  fire:     'shadow-[0_0_20px_rgba(249,115,22,0.35)]',
  gold:     'shadow-[0_0_25px_rgba(250,204,21,0.4)]',
  ice:      'shadow-[0_0_22px_rgba(125,211,252,0.35)]',
  shadow:   'shadow-[0_0_22px_rgba(139,92,246,0.4)]',
  neon:     'shadow-[0_0_20px_rgba(74,222,128,0.35)]',
  plasma:   'shadow-[0_0_28px_rgba(232,121,249,0.45)]',
  warlord:  'shadow-[0_0_25px_rgba(220,38,38,0.5)]',
  sage:     'shadow-[0_0_25px_rgba(34,211,238,0.45)]',
  absolute: 'shadow-[0_0_35px_rgba(255,215,0,0.55),0_0_60px_rgba(138,43,226,0.3)]',
};

const ACHIEVEMENT_SKINS = [
  { skinKey: 'warlord',  name: '⚔️ Военачальник', requirement: '#1 место в рейтинге PvP',    category: 'pvp'    as const, icon: '⚔️', gradientBorder: 'from-red-900/60 to-slate-900 border-red-700/50'       },
  { skinKey: 'sage',     name: '🧪 Мудрец',        requirement: '#1 место по опыту (PvE)',    category: 'exp'    as const, icon: '🧪', gradientBorder: 'from-cyan-900/60 to-slate-900 border-cyan-700/50'     },
  { skinKey: 'absolute', name: '👑 Абсолют',       requirement: '#1 место в общем рейтинге', category: 'global' as const, icon: '👑', gradientBorder: 'from-yellow-900/60 to-slate-900 border-yellow-600/60'  },
];

// ─── SkinList — вне CardSkinShop чтобы не ремаунтился ────────────────

type SkinListProps = {
  allSkins: Cosmetic[];
  rankPositions: Record<string, number | null>;
  previewSkin: CardSkin;
  activeSkin: CardSkin;
  buying: string | null;
  profileCoins: number;
  profileIsPremium: boolean;
  onHover:    (key: string) => void;
  onHoverEnd: () => void;
  onMobileTap:(key: string) => void;
  onEquip:    (key: string) => void;
  onBuy:      (item: Cosmetic) => void;
};

function SkinList({
  allSkins, rankPositions, previewSkin, activeSkin,
  buying, profileCoins, profileIsPremium,
  onHover, onHoverEnd, onMobileTap, onEquip, onBuy,
}: SkinListProps) {
  return (
    <div className="p-3 md:p-4 space-y-2">

      {/* ── Обычные скины ── */}
      {allSkins.map(item => {
        const skinKey      = item.image_url;
        const isEquipped   = activeSkin === skinKey;
        const isPreviewing = previewSkin === skinKey;
        const meta         = SKIN_META[skinKey] ?? { desc: '', accent: 'from-slate-700 to-slate-800' };
        const canBuy       = !item.is_premium || profileIsPremium;

        return (
          <div
            key={item.id}
            onMouseEnter={() => onHover(skinKey)}
            onMouseLeave={onHoverEnd}
            onClick={() => {
              if (window.innerWidth < 768) { onMobileTap(skinKey); }
              else if (item._isOwned) { onEquip(skinKey); }
            }}
            className={`
              relative rounded-xl border overflow-hidden cursor-pointer transition-all duration-200
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
                ) : item._isOwned ? (
                  <button onClick={() => onEquip(skinKey)}
                    className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-200 text-xs font-bold transition-colors">
                    Надеть
                  </button>
                ) : !canBuy ? (
                  <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg opacity-60">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-500 text-xs font-bold">Premium</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onBuy(item)}
                    disabled={buying === item.id || profileCoins < item.price}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black transition-all
                      ${profileCoins < item.price
                        ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-900/30 active:scale-95'
                      }`}
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

      {/* ── Achievement-скины ── */}
      <div className="pt-3 mt-1 border-t border-slate-800/60">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 px-1 mb-2 flex items-center gap-1.5">
          <Trophy className="w-3 h-3" /> Скины за достижения
        </p>
        <div className="space-y-2">
          {ACHIEVEMENT_SKINS.map(ach => {
            const isUnlocked   = rankPositions[ach.category] === 1;
            const isEquipped   = activeSkin === ach.skinKey;
            const isPreviewing = previewSkin === ach.skinKey;
            const meta         = SKIN_META[ach.skinKey] ?? { desc: '', accent: 'from-slate-700 to-slate-800' };

            return (
              <div
                key={ach.skinKey}
                // ✅ Превью доступно ВСЕМ — isUnlocked не проверяем
                onMouseEnter={() => onHover(ach.skinKey)}
                onMouseLeave={onHoverEnd}
                onClick={() => { if (window.innerWidth < 768) onMobileTap(ach.skinKey); }}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200
                  bg-gradient-to-r ${ach.gradientBorder}
                  ${isPreviewing ? 'ring-1 ring-inset ring-white/20' : ''}
                  cursor-pointer hover:brightness-110
                `}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0
                  ${isUnlocked ? 'bg-white/10' : 'bg-slate-800/50 grayscale'}`}>
                  {ach.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-black text-sm leading-tight ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                    {ach.name}
                  </p>
                  <p className="text-slate-500 text-[10px] mt-0.5">{meta.desc}</p>
                  <div className={`flex items-center gap-1 mt-0.5 text-[9px] font-bold uppercase tracking-wider
                    ${isUnlocked ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {isUnlocked
                      ? <><CheckCircle className="w-2.5 h-2.5" /> Разблокировано</>
                      : <><Lock className="w-2.5 h-2.5" /> {ach.requirement}</>
                    }
                  </div>
                </div>
                {/* ✅ Кнопка "Надеть" — только для #1 */}
                <div className="shrink-0" onClick={e => e.stopPropagation()}>
                  {isEquipped ? (
                    <div className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300 text-xs font-black uppercase">Надето</span>
                    </div>
                  ) : isUnlocked ? (
                    <button onClick={() => onEquip(ach.skinKey)}
                      className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-200 text-xs font-bold transition-colors">
                      Надеть
                    </button>
                  ) : (
                    <div className="p-2 bg-slate-800/50 rounded-lg">
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                  )}
                </div>
                {isPreviewing && !isEquipped && (
                  <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${meta.accent}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── PreviewPanel — тоже вне CardSkinShop ────────────────────────────

type PreviewPanelProps = {
  previewSkin: CardSkin;
  previewName: string;
  username: string;
  mmr: number;
  pRank: any;
  winRate: number;
  matchesPlayed: number;
};

function PreviewPanel({ previewSkin, previewName, username, mmr, pRank, winRate, matchesPlayed }: PreviewPanelProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 h-full">
      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-1">Предпросмотр</p>
        <p className="text-sm font-bold text-slate-300">{previewName}</p>
      </div>
      <div className={`transition-all duration-300 ${SKIN_GLOW[previewSkin as string] ?? ''}`}>
        <PlayerCard
          isOpponent={false}
          name={username}
          mmr={mmr}
          rank={pRank}
          winRate={winRate}
          matchesPlayed={matchesPlayed}
          skin={previewSkin}
          stage="idle"
        />
      </div>
      <p className="text-xs text-slate-500 italic text-center">{SKIN_META[previewSkin as string]?.desc ?? ''}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────

export function CardSkinShop({ onClose }: { onClose: () => void }) {
  const { user, profile, refreshProfile } = useAuth();
  const [items, setItems]       = useState<Cosmetic[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading]   = useState(true);
  const [buying, setBuying]     = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'shop' | 'preview'>('shop');

  const equippedSkin = (profile?.equipped_card_skin || 'default') as CardSkin;
  const [previewSkin, setPreviewSkin] = useState<CardSkin>(equippedSkin);
  const [activeSkin,  setActiveSkin]  = useState<CardSkin>(equippedSkin);

  const [rankPositions, setRankPositions] = useState<Record<string, number | null>>({
    pvp: null, exp: null, global: null,
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    if (!user) return;
    const { data: allItems } = await supabase.from('cosmetics').select('*').eq('type', 'card_skin');
    if (allItems) setItems(allItems);
    const { data: inventory } = await supabase.from('user_inventory').select('cosmetic_id').eq('user_id', user.id);
    if (inventory) setOwnedIds(new Set(inventory.map(i => i.cosmetic_id)));

    const [pvpRes, expRes, globalRes] = await Promise.all([
      supabase.rpc('get_user_rank_position', { target_user_id: user.id, sort_type: 'pvp'    }),
      supabase.rpc('get_user_rank_position', { target_user_id: user.id, sort_type: 'exp'    }),
      supabase.rpc('get_user_rank_position', { target_user_id: user.id, sort_type: 'global' }),
    ]);
    setRankPositions({ pvp: pvpRes.data ?? null, exp: expRes.data ?? null, global: globalRes.data ?? null });
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
    const { error } = await supabase
      .from('profiles')
      .update({ equipped_card_skin: skinId })
      .eq('id', user.id);
    // Триггер в БД отклонит запрос если нет прав на achievement-скин
    if (error) { alert(error.message); return; }
    setActiveSkin(skinId);
    setPreviewSkin(skinId);
    refreshProfile();
  };

  const pRank    = getPvPRank(profile?.mmr || 1000);
  const pvpStats = usePvPStats(user?.id);

  const allSkins: Cosmetic[] = [
    { id: '__default', name: 'Стандартная', type: 'card_skin', image_url: 'default', price: 0, is_premium: false, _isOwned: true },
    ...items.map(i => ({ ...i, _isOwned: ownedIds.has(i.id) })),
  ];

  const previewName =
    allSkins.find(s => s.image_url === previewSkin)?.name ??
    ACHIEVEMENT_SKINS.find(s => s.skinKey === previewSkin)?.name ??
    String(previewSkin);

  const skinListProps: SkinListProps = {
    allSkins,
    rankPositions,
    previewSkin,
    activeSkin,
    buying,
    profileCoins:     profile?.coins     ?? 0,
    profileIsPremium: profile?.is_premium ?? false,
    onHover:    (key) => setPreviewSkin(key as CardSkin),
    onHoverEnd: ()    => setPreviewSkin(activeSkin),
    onMobileTap:(key) => { setPreviewSkin(key as CardSkin); setMobileTab('preview'); },
    onEquip:    equipSkin,
    onBuy:      buyItem,
  };

  const previewProps: PreviewPanelProps = {
    previewSkin,
    previewName,
    username:      profile?.username || 'Player',
    mmr:           profile?.mmr      || 1000,
    pRank,
    winRate:       pvpStats.winRate,
    matchesPlayed: pvpStats.matchesPlayed,
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 md:p-4 animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-5xl h-[95vh] md:h-[88vh] bg-slate-950 border border-slate-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden relative flex flex-col md:flex-row">

        <button onClick={onClose}
          className="absolute top-3 right-3 z-50 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>

        {/* ── ДЕСКТОП: превью (не скроллится) ── */}
        <div className="hidden md:flex w-[45%] bg-slate-900/60 flex-col border-r border-slate-800/80 flex-shrink-0">
          <PreviewPanel {...previewProps} />
        </div>

        {/* ── ДЕСКТОП: список (скроллится) ── */}
        <div className="hidden md:flex w-[55%] flex-col h-full min-h-0">
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

          <div className="flex-1 overflow-y-auto min-h-0">
            {loading
              ? <div className="flex items-center justify-center h-40 text-slate-500 text-sm animate-pulse">Загрузка...</div>
              : <SkinList {...skinListProps} />
            }
          </div>

          <div className="px-6 py-3 border-t border-slate-800/80 flex-shrink-0">
            <p className="text-[10px] text-slate-600 text-center uppercase tracking-widest">
              Наведи на скин для предпросмотра
            </p>
          </div>
        </div>

        {/* ── МОБАЙЛ ── */}
        <div className="flex md:hidden flex-col h-full w-full min-h-0">
          <div className="px-4 pt-4 pb-3 border-b border-slate-800/80 flex-shrink-0 flex items-center justify-between pr-12">
            <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Скины карточки
            </h2>
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 font-black text-sm">{profile?.coins ?? 0}</span>
            </div>
          </div>

          <div className="flex border-b border-slate-800/80 flex-shrink-0">
            {([
              { key: 'shop',    icon: <ShoppingBag className="w-3.5 h-3.5" />, label: 'Магазин'      },
              { key: 'preview', icon: <Eye className="w-3.5 h-3.5" />,         label: 'Предпросмотр' },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setMobileTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black uppercase tracking-wider transition-colors
                  ${mobileTab === tab.key ? 'text-white border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {mobileTab === 'shop'
              ? loading
                ? <div className="flex items-center justify-center h-40 text-slate-500 text-sm animate-pulse">Загрузка...</div>
                : <SkinList {...skinListProps} />
              : <PreviewPanel {...previewProps} />
            }
          </div>
        </div>

      </div>
    </div>
  );
}