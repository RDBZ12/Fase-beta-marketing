CREATE TABLE IF NOT EXISTS public.learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    current_module VARCHAR(100),
    current_flow VARCHAR(100),
    current_step INTEGER DEFAULT 0,
    completed_modules JSONB DEFAULT '[]'::jsonb,
    completed_steps JSONB DEFAULT '[]'::jsonb,
    seen_resources JSONB DEFAULT '[]'::jsonb,
    seen_videos JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- RLS (Row Level Security)
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own learning progress" 
    ON public.learning_progress FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning progress" 
    ON public.learning_progress FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning progress" 
    ON public.learning_progress FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);
