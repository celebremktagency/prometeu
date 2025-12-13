CREATE TABLE IF NOT EXISTS user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  total_workouts integer DEFAULT 0,
  total_workout_minutes integer DEFAULT 0,
  streak_type text DEFAULT 'workout' CHECK (streak_type IN ('workout', 'pain_tracking', 'overall')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Função para atualizar automaticamente o updated_at
CREATE OR REPLACE FUNCTION update_user_streaks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar automaticamente o updated_at
CREATE TRIGGER trigger_update_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streaks_updated_at();

-- Índice para busca por user_id
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_type ON user_streaks(streak_type);

-- Inserir streak inicial para usuários existentes (exemplo)
-- INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_workouts)
-- SELECT id, 0, 0, CURRENT_DATE, 0 FROM users WHERE id NOT IN (SELECT user_id FROM user_streaks);