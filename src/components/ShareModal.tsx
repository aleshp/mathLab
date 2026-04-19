import { useRef, useState, useEffect, useCallback } from 'react';
import { toBlob } from 'html-to-image';
import { X, Share2, Download, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { PlayerCard } from './card-skins/PlayerCard';
import { useAuth } from '../contexts/AuthContext';
import { usePvPStats } from '../hooks/usePvPStats';
import { getPvPRank } from '../lib/gameLogic';

type Props = {
  onClose: () => void;
};

type ActionState = 'idle' | 'loading' | 'success' | 'error';

export function ShareModal({ onClose }: Props) {
  const { profile } = useAuth();
  const stats = usePvPStats(profile?.id);
  const cardRef = useRef<HTMLDivElement>(null);

  const [shareState, setShareState]     = useState<ActionState>('idle');
  const [downloadState, setDownloadState] = useState<ActionState>('idle');
  const [copyState, setCopyState]       = useState<ActionState>('idle');
  // undefined = not yet checked, true/false = result
  const [canShare, setCanShare]         = useState<boolean | undefined>(undefined);

  useEffect(() => {
    try {
      const testFile = new File([''], 'test.png', { type: 'image/png' });
      setCanShare(
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [testFile] })
      );
    } catch {
      setCanShare(false);
    }
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!profile) return null;

  const rank = getPvPRank(profile.mmr ?? 1000);
  const skin = (profile as any).equipped_card_skin ?? (profile.is_premium ? 'electric' : 'default');

  const generateBlob = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    return toBlob(cardRef.current, {
      quality:       1,
      pixelRatio:    3,
      cacheBust:     true,
      skipAutoScale: true,
      style: { margin: '0' },
    });
  }, []);

  const withState = async (
    setter: (s: ActionState) => void,
    fn: () => Promise<void>
  ) => {
    setter('loading');
    try {
      await fn();
      setter('success');
      setTimeout(() => setter('idle'), 2000);
    } catch (e) {
      console.error(e);
      setter('error');
      setTimeout(() => setter('idle'), 3000);
    }
  };

  const handleShare = () => withState(setShareState, async () => {
    const blob = await generateBlob();
    if (!blob) throw new Error('blob is null');
    const file = new File([blob], `mathlab-${profile.username}.png`, { type: 'image/png' });
    await navigator.share({
      title: 'Мой профиль MathLab',
      text:  `Я достиг ранга ${rank.fullName} в MathLab PvP! Попробуй обогнать меня 🚀\nhttps://mathlabpvp.org`,
      files: [file],
    });
  });

  const handleDownload = () => withState(setDownloadState, async () => {
    const blob = await generateBlob();
    if (!blob) throw new Error('blob is null');
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `MathLab_Rank_${profile.username}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const handleCopy = () => withState(setCopyState, async () => {
    const blob = await generateBlob();
    if (!blob) throw new Error('blob is null');
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
  });

  const isAnyLoading =
    shareState === 'loading' ||
    downloadState === 'loading' ||
    copyState === 'loading';

  return (
    <>
      {/* ─── Настоящий полноэкранный оверлей ─────────────────────────── */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-xl"
        style={{ zIndex: 9998 }}
        onClick={onClose}
        aria-hidden
      />

      {/* ─── Контейнер модалки ────────────────────────────────────────── */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 9999 }}
        role="dialog"
        aria-modal="true"
        aria-label="Поделиться карточкой"
      >
        <div
          className="relative w-full max-w-sm flex flex-col items-center gap-5"
          onClick={(e) => e.stopPropagation()}
        >

          {/* ── Кнопка закрытия ──────────────────────────────────────── */}
          <div className="w-full flex justify-between items-center">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500 select-none">
              Моя карточка
            </p>
            <button
              onClick={onClose}
              className="group p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all duration-200"
              aria-label="Закрыть"
            >
              <X className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
            </button>
          </div>

          {/* ── Карточка для экспорта ─────────────────────────────────── */}
          <div className="relative w-full">
            {/* Glow под карточкой */}
            <div className="absolute inset-4 bg-cyan-500/20 blur-2xl rounded-full pointer-events-none" />

            <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.6)]">
              <div
                ref={cardRef}
                className="bg-[#060c18] px-8 py-8 flex flex-col items-center justify-center"
              >
                <PlayerCard
                  isOpponent={false}
                  name={profile.username}
                  mmr={profile.mmr ?? 1000}
                  rank={rank}
                  winRate={stats.winRate}
                  matchesPlayed={stats.matchesPlayed}
                  skin={skin}
                  stage="idle"
                />
              </div>
            </div>
          </div>

          {/* ── Кнопки действий ──────────────────────────────────────── */}
          <div className="w-full flex flex-col gap-2.5">

            {/* Share — только где поддерживается */}
            {canShare === true && (
              <ActionButton
                state={shareState}
                disabled={isAnyLoading}
                onClick={handleShare}
                variant="primary"
                idleIcon={<Share2 className="w-4 h-4" />}
                idleLabel="Поделиться"
                successLabel="Готово!"
                errorLabel="Не удалось поделиться"
              />
            )}

            {/* Копировать в буфер — десктоп Chrome/Edge */}
            {typeof ClipboardItem !== 'undefined' && (
              <ActionButton
                state={copyState}
                disabled={isAnyLoading}
                onClick={handleCopy}
                variant={canShare ? 'secondary' : 'primary'}
                idleIcon={<Copy className="w-4 h-4" />}
                idleLabel="Скопировать картинку"
                successLabel="Скопировано в буфер!"
                errorLabel="Буфер недоступен"
              />
            )}

            {/* Скачать — всегда */}
            <ActionButton
              state={downloadState}
              disabled={isAnyLoading}
              onClick={handleDownload}
              variant="ghost"
              idleIcon={<Download className="w-4 h-4" />}
              idleLabel="Скачать PNG"
              successLabel="Сохранено!"
              errorLabel="Ошибка скачивания"
            />

          </div>

          {/* ── Подсказка под кнопками ───────────────────────────────── */}
          <p className="text-[11px] text-slate-600 text-center select-none">
            Карточка сохраняется в оригинальном качестве
          </p>

        </div>
      </div>
    </>
  );
}

// ─── Переиспользуемая кнопка с состояниями ────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ActionButtonProps {
  state:        ActionState;
  disabled:     boolean;
  onClick:      () => void;
  variant:      ButtonVariant;
  idleIcon:     React.ReactNode;
  idleLabel:    string;
  successLabel: string;
  errorLabel:   string;
}

function ActionButton({
  state, disabled, onClick, variant,
  idleIcon, idleLabel, successLabel, errorLabel,
}: ActionButtonProps) {

  const base =
    'w-full py-3.5 rounded-xl flex items-center justify-center gap-2.5 font-semibold text-sm tracking-wide transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 select-none';

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_24px_rgba(6,182,212,0.35)] hover:shadow-[0_0_32px_rgba(6,182,212,0.5)]',
    secondary:
      'bg-white/8 hover:bg-white/12 text-slate-200 border border-white/10 hover:border-white/20',
    ghost:
      'bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 border border-white/8 hover:border-white/15',
  };

  const icon =
    state === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> :
    state === 'success' ? <Check className="w-4 h-4" /> :
    state === 'error'   ? <AlertCircle className="w-4 h-4" /> :
    idleIcon;

  const label =
    state === 'success' ? successLabel :
    state === 'error'   ? errorLabel :
    idleLabel;

  const variantOverride =
    state === 'success' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' :
    state === 'error'   ? 'bg-red-500/15 border border-red-500/35 text-red-400' :
    variants[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled || state === 'loading'}
      className={`${base} ${variantOverride}`}
    >
      {icon}
      {label}
    </button>
  );
}