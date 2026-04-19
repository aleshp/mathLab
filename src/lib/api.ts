// В файле lib/api.ts или прямо в компоненте
const fetchErrors = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_errors')
    .select(`
      id,
      user_answer,
      correct_answer,
      created_at,
      problem:problems (
        id,
        question,
        hint,
        image_url
      ),
      module:modules (
        id,
        name
      )
    `)
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString()) // Только актуальные (не протухшие)
    .order('created_at', { ascending: false });
    
  return { data, error };
};