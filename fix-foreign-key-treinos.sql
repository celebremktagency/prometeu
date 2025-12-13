-- Fix foreign key constraint for treinos table
-- The issue is that treinos.usuario_id references auth.users but should allow NULL values

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE treinos DROP CONSTRAINT IF EXISTS treinos_usuario_id_fkey;

-- Step 2: Update all NULL values to a valid user_id (optional - or keep them as NULL)
-- UPDATE treinos SET usuario_id = '8b65f94b-3479-4ad5-aba5-16ec3acc218c' WHERE usuario_id IS NULL;

-- Step 3: Add the foreign key constraint back with proper NULL handling
ALTER TABLE treinos 
ADD CONSTRAINT treinos_usuario_id_fkey 
FOREIGN KEY (usuario_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Alternative: If you want usuario_id to reference user_profiles instead of auth.users
-- ALTER TABLE treinos 
-- ADD CONSTRAINT treinos_usuario_id_fkey 
-- FOREIGN KEY (usuario_id) 
-- REFERENCES user_profiles(id) 
-- ON DELETE SET NULL;