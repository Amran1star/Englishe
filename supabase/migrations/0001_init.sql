-- ============================================================
-- English Mastery — المرحلة 1: المخطط الكامل + RLS + التخزين
-- نفّذ هذا الملف كاملاً في: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- ---------- الدوال المساعدة ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- المستويات (CEFR) ----------
create table public.levels (
  code text primary key check (code in ('A0','A1','A2','B1','B2','C1')),
  title_en text not null,
  title_ar text not null,
  description_ar text,
  sort_order int not null unique,
  pass_score int not null default 70 check (pass_score between 1 and 100),
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- الملفات الشخصية ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  role text not null default 'student' check (role in ('student','admin')),
  current_level text not null default 'A0' references public.levels(code),
  placement_completed boolean not null default false,
  preferred_accent text not null default 'us' check (preferred_accent in ('us','uk')),
  daily_goal_minutes int not null default 15 check (daily_goal_minutes between 5 and 240),
  xp int not null default 0 check (xp >= 0),
  streak_days int not null default 0 check (streak_days >= 0),
  last_active_date date,
  show_on_leaderboard boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- دالة الصلاحيات (بعد إنشاء profiles) ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- ---------- المنهج ----------
create table public.units (
  id uuid primary key default gen_random_uuid(),
  level_code text not null references public.levels(code) on delete cascade,
  title_en text not null,
  title_ar text not null,
  description_ar text,
  sort_order int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index units_level_idx on public.units (level_code, sort_order);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  slug text not null,
  title_en text not null,
  title_ar text not null,
  objective_ar text,
  content jsonb not null default '{}'::jsonb,   -- الشرح والأمثلة والقاعدة (تُملأ في المرحلة 2-3)
  sort_order int not null default 0,
  estimated_minutes int not null default 10 check (estimated_minutes > 0),
  xp_reward int not null default 10 check (xp_reward >= 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_id, slug)
);
create index lessons_unit_idx on public.lessons (unit_id, sort_order);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  type text not null,
  content jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index exercises_lesson_idx on public.exercises (lesson_id, sort_order);

-- ---------- الاختبارات والأسئلة ----------
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('placement','lesson','unit','level','general')),
  level_code text references public.levels(code) on delete set null,
  unit_id uuid references public.units(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  title_ar text not null,
  title_en text,
  pass_score int not null default 70 check (pass_score between 1 and 100),
  time_limit_seconds int check (time_limit_seconds is null or time_limit_seconds > 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  type text not null,
  body jsonb not null,
  explanation_ar text,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index questions_quiz_idx on public.questions (quiz_id, sort_order);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score int not null check (score >= 0),
  total int not null check (total > 0),
  percentage numeric(5,2) not null check (percentage between 0 and 100),
  passed boolean not null,
  answers jsonb not null default '[]'::jsonb,
  duration_seconds int check (duration_seconds is null or duration_seconds >= 0),
  created_at timestamptz not null default now()
);
create index quiz_attempts_user_idx on public.quiz_attempts (user_id, created_at desc);

-- ---------- المفردات ----------
create table public.words (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  translation_ar text not null,
  part_of_speech text,
  example_en text,
  example_ar text,
  synonyms text[] not null default '{}',
  antonyms text[] not null default '{}',
  level_code text references public.levels(code) on delete set null,
  topic text,
  created_at timestamptz not null default now(),
  unique (word, part_of_speech)
);
create index words_level_topic_idx on public.words (level_code, topic);

create table public.favorite_words (
  user_id uuid not null references public.profiles(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, word_id)
);

-- المراجعة المتباعدة (Spaced Repetition)
create table public.word_reviews (
  user_id uuid not null references public.profiles(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  ease numeric(4,2) not null default 2.5,
  interval_days int not null default 0,
  repetitions int not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  primary key (user_id, word_id)
);
create index word_reviews_due_idx on public.word_reviews (user_id, due_at);

-- ---------- التقدم والنشاط ----------
create table public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  best_score int check (best_score is null or best_score between 0 and 100),
  time_spent_seconds int not null default 0 check (time_spent_seconds >= 0),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  metadata jsonb not null default '{}'::jsonb,
  xp_earned int not null default 0,
  created_at timestamptz not null default now()
);
create index activity_log_user_idx on public.activity_log (user_id, created_at desc);

-- ---------- ملفات PDF والاختبارات الناتجة عنها ----------
create table public.pdf_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  size_bytes bigint not null check (size_bytes > 0),
  page_count int,
  language text check (language is null or language in ('ar','en','mixed')),
  status text not null default 'uploaded' check (status in ('uploaded','processing','ready','failed')),
  extracted_text text,
  created_at timestamptz not null default now()
);
create index pdf_documents_user_idx on public.pdf_documents (user_id, created_at desc);

create table public.pdf_quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  document_id uuid not null references public.pdf_documents(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index pdf_quizzes_user_idx on public.pdf_quizzes (user_id, created_at desc);

create table public.pdf_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pdf_quiz_id uuid not null references public.pdf_quizzes(id) on delete cascade,
  score int not null check (score >= 0),
  total int not null check (total > 0),
  answers jsonb not null default '[]'::jsonb,
  duration_seconds int check (duration_seconds is null or duration_seconds >= 0),
  created_at timestamptz not null default now()
);

-- ---------- الإنجازات ----------
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title_ar text not null,
  title_en text,
  description_ar text,
  icon text,
  xp_reward int not null default 0 check (xp_reward >= 0)
);

create table public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- ---------- إعدادات الموقع واستهلاك الذكاء الاصطناعي (للمدير) ----------
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  feature text not null,
  model text,
  input_tokens int check (input_tokens is null or input_tokens >= 0),
  output_tokens int check (output_tokens is null or output_tokens >= 0),
  created_at timestamptz not null default now()
);
create index ai_usage_log_created_idx on public.ai_usage_log (created_at desc);

-- ---------- إنشاء الملف الشخصي تلقائياً عند التسجيل ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 100))
  on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- منع المستخدم من ترقية نفسه إلى مدير ----------
-- auth.uid() يكون null عند التنفيذ من SQL Editor أو بمفتاح service_role، فيُسمح هناك.
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end $$;
revoke execute on function public.protect_profile_role() from public, anon, authenticated;

create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ============================================================
-- Row Level Security
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'levels','profiles','units','lessons','exercises','quizzes','questions','quiz_attempts',
    'words','favorite_words','word_reviews','lesson_progress','activity_log','pdf_documents',
    'pdf_quizzes','pdf_quiz_attempts','achievements','user_achievements','site_settings','ai_usage_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- أ) محتوى منشور: يقرؤه المسجّلون، ويكتبه المدير فقط
do $$
declare t text;
begin
  foreach t in array array['levels','units','lessons','quizzes'] loop
    execute format('create policy "read published" on public.%I for select to authenticated using (is_published or public.is_admin())', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ب) محتوى مرجعي: يقرؤه المسجّلون، ويكتبه المدير فقط
do $$
declare t text;
begin
  foreach t in array array['exercises','questions','words','achievements'] loop
    execute format('create policy "read all" on public.%I for select to authenticated using (true)', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ج) بيانات المستخدم الخاصة: صاحبها فقط (والمدير للقراءة)
do $$
declare t text;
begin
  foreach t in array array[
    'quiz_attempts','favorite_words','word_reviews','lesson_progress',
    'pdf_documents','pdf_quizzes','pdf_quiz_attempts'
  ] loop
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy "admin read" on public.%I for select to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- د) الملف الشخصي (لا يوجد INSERT: يُنشأ بالـ trigger. ولا DELETE: يُحذف بحذف الحساب)
create policy "read own profile" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "admin update profiles" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- هـ) سجل النشاط: قراءة وإضافة لصاحبه فقط
create policy "own activity read" on public.activity_log for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "own activity insert" on public.activity_log for insert to authenticated
  with check (user_id = auth.uid());

-- و) الإنجازات المكتسبة: قراءة لصاحبها، والمنح يتم من الخادم لاحقاً
create policy "own achievements read" on public.user_achievements for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "admin manage achievements" on public.user_achievements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ز) الإعدادات: العامة للجميع، والباقي للمدير
create policy "read public settings" on public.site_settings for select to anon, authenticated
  using (is_public or public.is_admin());
create policy "admin write settings" on public.site_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ح) استهلاك الذكاء الاصطناعي: قراءة للمدير فقط (الكتابة من الخادم بمفتاح service_role)
create policy "admin read ai usage" on public.ai_usage_log for select to authenticated
  using (public.is_admin());

-- ============================================================
-- التخزين: حاوية PDF خاصة، لكل مستخدم مجلد باسم معرّفه
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pdfs', 'pdfs', false, 20971520, array['application/pdf'])
on conflict (id) do nothing;

create policy "pdfs read own" on storage.objects for select to authenticated
  using (bucket_id = 'pdfs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "pdfs insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pdfs delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- بيانات أولية: المستويات الستة
-- ============================================================
insert into public.levels (code, title_en, title_ar, description_ar, sort_order, pass_score) values
  ('A0', 'Absolute Beginner',    'الصفر المطلق',   'البداية من الحروف والأصوات والكلمات الأولى دون أي معرفة سابقة.', 0, 70),
  ('A1', 'Beginner',             'مبتدئ',          'التعريف بالنفس والجمل البسيطة والمواقف اليومية الأساسية.',        1, 70),
  ('A2', 'Elementary',           'ما قبل المتوسط', 'التعبير عن الروتين والماضي والمستقبل القريب بجمل أطول.',          2, 70),
  ('B1', 'Intermediate',         'متوسط',          'التحدث عن التجارب والآراء وفهم النصوص الواضحة.',                  3, 70),
  ('B2', 'Upper-Intermediate',   'فوق المتوسط',    'نقاش المواضيع المعقدة وكتابة نصوص مفصلة.',                        4, 75),
  ('C1', 'Advanced',             'متقدم',          'استخدام اللغة بمرونة وبأسلوب دقيق في السياقات الأكاديمية والمهنية.', 5, 80)
on conflict (code) do nothing;

-- ============================================================
-- لتعيين أول مدير (بعد أن تسجّل حسابك من الموقع)، نفّذ على حدة:
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'your@email.com');
-- ============================================================
