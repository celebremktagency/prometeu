-- ============================================
-- PROMETEUS: ADD MOBILIDADE FIELD TO EXERCICIOS
-- Execute this script in Supabase SQL Editor
-- ============================================

BEGIN;

-- 1. Add mobilidade column
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS mobilidade text;

-- 2. Add constraint for valid values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'exercicios_mobilidade_check'
    ) THEN
        ALTER TABLE public.exercicios 
        ADD CONSTRAINT exercicios_mobilidade_check 
        CHECK ((mobilidade = ANY (ARRAY['musculacao'::text, 'cardio'::text, 'yoga'::text, 'flexibilidade'::text])));
    END IF;
END $$;

-- 3. Set default values for existing exercises based on muscle groups
UPDATE public.exercicios 
SET mobilidade = 'musculacao' 
WHERE mobilidade IS NULL 
  AND (grupo_muscular && ARRAY['peito', 'costas', 'ombros', 'bracos', 'triceps', 'biceps', 'pernas', 'quadriceps', 'posteriores', 'gluteos', 'panturrilhas']);

UPDATE public.exercicios 
SET mobilidade = 'flexibilidade' 
WHERE mobilidade IS NULL 
  AND (grupo_muscular && ARRAY['core', 'abdomen'] OR nome ILIKE '%prancha%' OR nome ILIKE '%alongamento%');

UPDATE public.exercicios 
SET mobilidade = 'cardio' 
WHERE mobilidade IS NULL 
  AND (nome ILIKE '%cardio%' OR nome ILIKE '%corrida%' OR nome ILIKE '%ciclismo%');

-- 4. Set default 'musculacao' for any remaining NULL values
UPDATE public.exercicios 
SET mobilidade = 'musculacao' 
WHERE mobilidade IS NULL;

-- 5. Create performance index
CREATE INDEX IF NOT EXISTS idx_exercicios_mobilidade ON public.exercicios(mobilidade);

-- 6. Verify the update
SELECT 
    mobilidade,
    COUNT(*) as count
FROM public.exercicios 
GROUP BY mobilidade 
ORDER BY mobilidade;

COMMIT;

-- Success message
SELECT 'Coluna mobilidade adicionada com sucesso à tabela exercicios! 🎯' as resultado;