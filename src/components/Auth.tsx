import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { containsBadWord } from '../lib/profanityFilter';
import {
  Eye, EyeOff, Loader, CheckSquare, Square, CheckCircle, Mail,
  ArrowLeft, Zap, Lock, User, Send,
} from 'lucide-react';

type Props = {
  onOpenLegal: (type: 'privacy' | 'terms' | 'refund') => void;
};

type Screen = 'login' | 'register' | 'forgot' | 'email_sent' | 'reset_sent';

// ── Helpers ──────────────────────────────────────────────────────────────────
function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: 'Слабый', color: 'bg-red-500', text: 'text-red-400' };
  if (score <= 3) return { score, label: 'Средний', color: 'bg-yellow-500', text: 'text-yellow-400' };
  return { score, label: 'Надёжный', color: 'bg-emerald-500', text: 'text-emerald-400' };
}

function validateUsername(value: string) {
  const t = value.trim();
  if (t.length < 3) return 'Минимум 3 символа';
  if (t.length > 20) return 'Максимум 20 символов';
  if (!/^[a-zA-Z0-9_]+$/.test(t)) return 'Только латиница, цифры и _';
  if (containsBadWord(t)) return 'Недопустимое имя';
  return '';
}

// ── Декоративные символы ─────────────────────────────────────────────────────
const MATH_SYMBOLS = ['∑', 'π', '∞', '√', '∫', 'Δ', 'θ', 'λ', '∂', 'φ'];

function FloatingSymbols() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {MATH_SYMBOLS.map((sym, i) => (
        <div
          key={i}
          className="absolute font-mono text-cyan-500/8 font-black"
          style={{
            fontSize: `${1.5 + (i % 4) * 0.8}rem`,
            left: `${8 + (i * 9.3) % 84}%`,
            top: `${5 + (i * 11.7) % 85}%`,
            transform: `rotate(${(i * 37) % 60 - 30}deg)`,
          }}
        >
          {sym}
        </div>
      ))}
      {/* Grid dots */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #22d3ee 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
}

// ── Input компонент ───────────────────────────────────────────────────────────
function Field({
  label, icon: Icon, error, hint, children,
}: {
  label: string;
  icon: React.ElementType;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
        <Icon className="w-3 h-3" />
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 pl-1">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-600 pl-1">{hint}</p>}
    </div>
  );
}

function Input({
  type = 'text', value, onChange, placeholder, required, suffix, className = '',
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  suffix?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white
          placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30
          transition-all duration-200 text-sm ${suffix ? 'pr-12' : ''} ${className}`}
      />
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
      )}
    </div>
  );
}

// ── Главный компонент ─────────────────────────────────────────────────────────
export function Auth({ onOpenLegal }: Props) {
  const { t } = useTranslation();
  const { signIn, signUp } = useAuth();

  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const pwStrength = getPasswordStrength(password);

  function reset() {
    setError('');
    setUsernameError('');
    setPassword('');
    setShowPassword(false);
  }

  function goTo(s: Screen) {
    reset();
    setScreen(s);
  }

  function handleUsernameChange(v: string) {
    if (v.length > 20) return;
    setUsername(v);
    setUsernameError(v.length > 0 ? validateUsername(v) : '');
  }

  // ── Логин / Регистрация ───────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (screen === 'register') {
      if (!agreed) { setError(t('auth.error_agree')); return; }
      const err = validateUsername(username);
      if (err) { setUsernameError(err); return; }
    }

    setLoading(true);
    try {
      if (screen === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, username);
        setScreen('email_sent');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  }

  // ── Сброс пароля ─────────────────────────────────────────────────────────
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email) { setError('Введите email'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setScreen('reset_sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки письма');
    } finally {
      setLoading(false);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LAYOUT SHELL
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative">
      <FloatingSymbols />

      {/* Glow top-center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md z-10">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/20 border border-cyan-500/30 bg-slate-800 mb-4">
            <img src="/logo.png" alt="MathLab" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display="none"; }} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Math<span className="text-cyan-400">Lab</span> <span className="text-slate-400 font-light">PVP</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1 tracking-widest uppercase">
            Подготовка к экзамену по математике нового поколения
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">

          {/* ── TAB SWITCHER (login / register) ───────────────────────────── */}
          {(screen === 'login' || screen === 'register') && (
            <div className="flex border-b border-slate-800">
              {(['login', 'register'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => goTo(s)}
                  className={`flex-1 py-4 text-sm font-bold tracking-wide transition-all duration-200 ${
                    screen === s
                      ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {s === 'login' ? 'Войти' : 'Создать аккаунт'}
                </button>
              ))}
            </div>
          )}

          {/* ── BACK HEADER (forgot / sent screens) ───────────────────────── */}
          {(screen === 'forgot' || screen === 'email_sent' || screen === 'reset_sent') && (
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800">
              {screen === 'forgot' && (
                <button
                  onClick={() => goTo('login')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <span className="text-white font-bold text-sm">
                {screen === 'forgot' && 'Восстановление пароля'}
                {screen === 'email_sent' && 'Подтверди аккаунт'}
                {screen === 'reset_sent' && 'Письмо отправлено'}
              </span>
            </div>
          )}

          <div className="p-6">

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* LOGIN */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {screen === 'login' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Email" icon={Mail}>
                  <Input
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="your@email.com"
                    required
                  />
                </Field>

                <Field label="Пароль" icon={Lock}>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••"
                    required
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-500 hover:text-cyan-400 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                </Field>

                {/* Forgot link */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => goTo('forgot')}
                    className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    Забыл пароль?
                  </button>
                </div>

                {error && <ErrorBox>{error}</ErrorBox>}

                <SubmitButton loading={loading}>Войти</SubmitButton>
              </form>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* REGISTER */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {screen === 'register' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field
                  label="Имя игрока"
                  icon={User}
                  error={usernameError}
                  hint={!usernameError && username.length > 0 ? 'Латиница, цифры и _ · 3–20 символов' : undefined}
                >
                  <Input
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="YourNickname"
                    required
                    className={usernameError ? 'border-red-500/60 focus:border-red-400' : ''}
                    suffix={
                      <span className={`text-xs tabular-nums ${
                        username.length >= 20 ? 'text-red-400' : username.length >= 15 ? 'text-yellow-400' : 'text-slate-600'
                      }`}>
                        {username.length}/20
                      </span>
                    }
                  />
                </Field>

                <Field label="Email" icon={Mail}>
                  <Input
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="your@email.com"
                    required
                  />
                </Field>

                <Field label="Пароль" icon={Lock}>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={setPassword}
                    placeholder="Минимум 6 символов"
                    required
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-500 hover:text-cyan-400 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                  {/* Password strength */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i <= pwStrength.score ? pwStrength.color : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${pwStrength.text}`}>{pwStrength.label}</p>
                    </div>
                  )}
                </Field>

                {/* Agreement */}
                <button
                  type="button"
                  onClick={() => setAgreed(!agreed)}
                  className="flex items-start gap-2.5 w-full text-left group"
                >
                  <div className={`mt-0.5 flex-shrink-0 transition-colors ${
                    agreed ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'
                  }`}>
                    {agreed
                      ? <CheckSquare className="w-4 h-4" />
                      : <Square className="w-4 h-4" />}
                  </div>
                  <span className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors">
                    Я принимаю{' '}
                    <span
                      onClick={(e) => { e.stopPropagation(); onOpenLegal('terms'); }}
                      className="text-cyan-500 hover:underline cursor-pointer"
                    >
                      условия использования
                    </span>
                    {' '}и{' '}
                    <span
                      onClick={(e) => { e.stopPropagation(); onOpenLegal('privacy'); }}
                      className="text-cyan-500 hover:underline cursor-pointer"
                    >
                      политику конфиденциальности
                    </span>
                  </span>
                </button>

                {error && <ErrorBox>{error}</ErrorBox>}

                <SubmitButton loading={loading} disabled={!agreed || !!usernameError}>
                  Создать аккаунт
                </SubmitButton>
              </form>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* FORGOT PASSWORD */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {screen === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-4">
                <p className="text-slate-400 text-sm leading-relaxed">
                  Введи свой email — мы отправим ссылку для сброса пароля.
                </p>

                <Field label="Email" icon={Mail}>
                  <Input
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="your@email.com"
                    required
                  />
                </Field>

                {error && <ErrorBox>{error}</ErrorBox>}

                <SubmitButton loading={loading} icon={<Send className="w-4 h-4" />}>
                  Отправить письмо
                </SubmitButton>
              </form>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* EMAIL SENT (после регистрации) */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {screen === 'email_sent' && (
              <SuccessScreen
                icon={<CheckCircle className="w-10 h-10 text-emerald-400" />}
                glow="from-emerald-500/20 to-transparent"
                title="Проверь почту!"
                email={email}
                description="Мы отправили письмо для подтверждения аккаунта. Перейди по ссылке, чтобы войти."
                action={
                  <button
                    onClick={() => { reset(); setScreen('login'); }}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl text-sm transition-all"
                  >
                    Войти после подтверждения
                  </button>
                }
              />
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* RESET SENT (после запроса сброса) */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {screen === 'reset_sent' && (
              <SuccessScreen
                icon={<Lock className="w-10 h-10 text-cyan-400" />}
                glow="from-cyan-500/20 to-transparent"
                title="Письмо отправлено"
                email={email}
                description="Перейди по ссылке в письме, чтобы задать новый пароль. Проверь папку «Спам»."
                action={
                  <button
                    onClick={() => { reset(); setEmail(''); setScreen('login'); }}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl text-sm transition-all"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <ArrowLeft className="w-4 h-4" /> Назад к входу
                    </span>
                  </button>
                }
              />
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <a
            href="mailto:support@mathlabpvp.org"
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors inline-flex items-center gap-1.5"
          >
            <Mail className="w-3 h-3" />
            support@mathlabpvp.org
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Переиспользуемые части ────────────────────────────────────────────────────
function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
      <p className="text-red-400 text-sm leading-snug">{children}</p>
    </div>
  );
}

function SubmitButton({
  loading, disabled, children, icon,
}: {
  loading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500
        disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed
        text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-cyan-900/30
        active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
    >
      {loading
        ? <><Loader className="w-4 h-4 animate-spin" /> Загрузка...</>
        : <>{icon}{children}</>}
    </button>
  );
}

function SuccessScreen({
  icon, glow, title, email, description, action,
}: {
  icon: React.ReactNode;
  glow: string;
  title: string;
  email: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="text-center space-y-5">
      {/* Icon glow */}
      <div className="relative flex justify-center">
        <div className={`absolute inset-0 bg-gradient-radial ${glow} blur-2xl`} />
        <div className="relative w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
          {icon}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-black text-white mb-1">{title}</h2>
        <p className="text-cyan-400 font-mono text-sm font-semibold break-all">{email}</p>
      </div>

      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>

      {action}

      <p className="text-slate-600 text-xs">
        Не пришло? Проверь папку <span className="text-slate-500">«Спам»</span>
      </p>
    </div>
  );
}