import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';
import { containsBadWord } from '../lib/profanityFilter';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // === ГЛОБАЛЬНЫЙ ХЕЛПЕР ДЛЯ ПЕРЕСЧЕТА ГОЛОДА ===
  // Вычисляет, сколько времени прошло с последнего кормления
  const syncHungerData = (data: any, userId: string) => {
    let profileData = { ...data };
    
    if (profileData.companion_name) {
      const lastUpdate = profileData.last_fed_at ? new Date(profileData.last_fed_at).getTime() : Date.now();
      const now = Date.now();
      const hoursPassed = (now - lastUpdate) / (1000 * 60 * 60);
      const hungerLoss = Math.floor(hoursPassed * 5); // Теряет 5 единиц в час

      if (hungerLoss > 0) {
        const newHunger = Math.max(0, (profileData.companion_hunger || 100) - hungerLoss);
        
        // Если голод изменился, обновляем локальный стейт и пишем в базу
        if (newHunger !== profileData.companion_hunger) {
          profileData.companion_hunger = newHunger;
          profileData.last_fed_at = new Date().toISOString();
          
          // Фоновое обновление БД (не блокирует UI)
          supabase.from('profiles').update({ 
            companion_hunger: newHunger,
            last_fed_at: profileData.last_fed_at
          }).eq('id', userId).then();
        }
      }
    }
    return profileData;
  };

  // Обновление профиля вручную (для Реактора и Магазина)
  async function refreshProfile() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) setProfile(syncHungerData(data, user.id)); // Пропускаем через проверку голода
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
    }
  }

  useEffect(() => {
    // Проверка текущей сессии
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Слушатель изменений авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  },[]);

  // Realtime подписка на профиль
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        // Пропускаем профиль через функцию пересчета голода ДО первой отрисовки!
        setProfile(syncHungerData(data, userId));
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setLoading(false); 
    }
  }

  async function signUp(email: string, password: string, username: string) {
    const trimmed = username.trim();

    if (trimmed.length < 3 || trimmed.length > 20) {
      throw new Error('Имя должно быть от 3 до 20 символов');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      throw new Error('Имя может содержать только латиницу, цифры и _');
    }
    if (containsBadWord(trimmed)) {
      throw new Error('Недопустимое имя пользователя');
    }

    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', trimmed)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) throw new Error('Это имя уже занято, придумайте другое');

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      const { error: insertError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: trimmed,
        clearance_level: 0,
        total_experiments: 0,
        success_rate: 0,
      });
      if (insertError) throw insertError;
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      setUser(null);
      setProfile(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}