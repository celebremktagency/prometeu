-- Create tables for exercise feedback system

-- Table for exercise feedback/ratings
CREATE TABLE IF NOT EXISTS exercise_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES treinos(id) ON DELETE CASCADE,
    workout_execution_id UUID, -- Link to specific workout session
    
    -- Feedback data
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5), -- 1=very easy, 5=very hard
    pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10), -- 0-10 pain scale
    enjoyment_level INTEGER CHECK (enjoyment_level >= 1 AND enjoyment_level <= 5), -- 1-5 enjoyment
    
    -- Text feedback
    notes TEXT,
    what_worked_well TEXT,
    what_was_difficult TEXT,
    suggestions TEXT,
    
    -- Completion data
    completed_reps INTEGER,
    completed_sets INTEGER,
    actual_duration_minutes INTEGER,
    rest_time_minutes INTEGER,
    
    -- Status
    exercise_completed BOOLEAN DEFAULT true,
    technique_feedback TEXT, -- Professional can add technique notes
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for workout session summary
CREATE TABLE IF NOT EXISTS workout_session_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    workout_template_id UUID REFERENCES workout_templates(id),
    
    -- Session data
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_duration_minutes INTEGER,
    
    -- Overall feedback
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    overall_difficulty INTEGER CHECK (overall_difficulty >= 1 AND overall_difficulty <= 5),
    energy_level_before INTEGER CHECK (energy_level_before >= 1 AND energy_level_before <= 5),
    energy_level_after INTEGER CHECK (energy_level_after >= 1 AND energy_level_after <= 5),
    
    -- Pain tracking
    pain_before INTEGER CHECK (pain_before >= 0 AND pain_before <= 10),
    pain_after INTEGER CHECK (pain_after >= 0 AND pain_after <= 10),
    pain_location TEXT,
    
    -- General feedback
    workout_notes TEXT,
    trainer_notes TEXT, -- Professional can add notes
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('started', 'paused', 'completed', 'abandoned')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exercise_feedback_user_id ON exercise_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_feedback_exercise_id ON exercise_feedback(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_feedback_workout_execution_id ON exercise_feedback(workout_execution_id);
CREATE INDEX IF NOT EXISTS idx_exercise_feedback_created_at ON exercise_feedback(created_at);

CREATE INDEX IF NOT EXISTS idx_workout_session_summary_user_id ON workout_session_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_session_summary_template_id ON workout_session_summary(workout_template_id);
CREATE INDEX IF NOT EXISTS idx_workout_session_summary_started_at ON workout_session_summary(started_at);

-- RLS (Row Level Security) policies

-- Exercise feedback policies
ALTER TABLE exercise_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own feedback
CREATE POLICY "Users can manage their own exercise feedback" ON exercise_feedback
    FOR ALL USING (auth.uid() = user_id);

-- Professionals can view feedback from their clients
CREATE POLICY "Professionals can view client feedback" ON exercise_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM professional_clients pc
            WHERE pc.professional_id = auth.uid() 
            AND pc.client_id = exercise_feedback.user_id
            AND pc.status = 'ativo'
        )
    );

-- Professionals can add technique feedback to their clients' exercises
CREATE POLICY "Professionals can add technique feedback" ON exercise_feedback
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM professional_clients pc
            WHERE pc.professional_id = auth.uid() 
            AND pc.client_id = exercise_feedback.user_id
            AND pc.status = 'ativo'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM professional_clients pc
            WHERE pc.professional_id = auth.uid() 
            AND pc.client_id = exercise_feedback.user_id
            AND pc.status = 'ativo'
        )
    );

-- Workout session summary policies
ALTER TABLE workout_session_summary ENABLE ROW LEVEL SECURITY;

-- Users can manage their own workout sessions
CREATE POLICY "Users can manage their own workout sessions" ON workout_session_summary
    FOR ALL USING (auth.uid() = user_id);

-- Professionals can view and add notes to their clients' sessions
CREATE POLICY "Professionals can view client sessions" ON workout_session_summary
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM professional_clients pc
            WHERE pc.professional_id = auth.uid() 
            AND pc.client_id = workout_session_summary.user_id
            AND pc.status = 'ativo'
        )
    );

CREATE POLICY "Professionals can add notes to client sessions" ON workout_session_summary
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM professional_clients pc
            WHERE pc.professional_id = auth.uid() 
            AND pc.client_id = workout_session_summary.user_id
            AND pc.status = 'ativo'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM professional_clients pc
            WHERE pc.professional_id = auth.uid() 
            AND pc.client_id = workout_session_summary.user_id
            AND pc.status = 'ativo'
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER update_exercise_feedback_updated_at 
    BEFORE UPDATE ON exercise_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_session_summary_updated_at 
    BEFORE UPDATE ON workout_session_summary 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample queries for professionals to view client progress:

/*
-- Get all feedback from a specific client
SELECT ef.*, t.exercicio, t.descricao
FROM exercise_feedback ef
JOIN treinos t ON ef.exercise_id = t.id
WHERE ef.user_id = 'client_user_id'
ORDER BY ef.created_at DESC;

-- Get client's workout session summaries
SELECT * FROM workout_session_summary
WHERE user_id = 'client_user_id'
ORDER BY started_at DESC;

-- Get average ratings by exercise for a client
SELECT 
    t.exercicio,
    AVG(ef.rating) as avg_rating,
    AVG(ef.difficulty_level) as avg_difficulty,
    AVG(ef.pain_level) as avg_pain,
    COUNT(*) as total_sessions
FROM exercise_feedback ef
JOIN treinos t ON ef.exercise_id = t.id
WHERE ef.user_id = 'client_user_id'
GROUP BY t.id, t.exercicio
ORDER BY avg_rating DESC;

-- Get client progress over time
SELECT 
    DATE(ef.created_at) as workout_date,
    AVG(ef.rating) as avg_rating,
    AVG(ef.difficulty_level) as avg_difficulty,
    AVG(ef.pain_level) as avg_pain
FROM exercise_feedback ef
WHERE ef.user_id = 'client_user_id'
GROUP BY DATE(ef.created_at)
ORDER BY workout_date DESC;
*/