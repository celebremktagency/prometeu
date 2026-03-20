import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export type UserType = 'client' | 'trainer';

export const useUserType = () => {
 const [userType, setUserType] = useState<UserType>('client');
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  checkUserType();
 }, []);

 const checkUserType = async () => {
  try {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) {
    setUserType('client');
    setLoading(false);
    return;
   }

   // Check user profile first for type
   const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('tipo')
    .eq('user_id', user.id)
    .single();

   // Check if user type indicates trainer/professional
   if (userProfile?.tipo === 'personal_trainer' || userProfile?.tipo === 'profissional') {
    setUserType('trainer');
   } else {
    // Fallback: sem perfil no banco, usar metadata do auth
    const tipo = user.user_metadata?.tipo;
    setUserType(tipo === 'personal_trainer' || tipo === 'profissional' ? 'trainer' : 'client');
   }
  } catch (error) {
   console.log('Error checking user type:', error);
   setUserType('client');
  } finally {
   setLoading(false);
  }
 };

 return { userType, loading, refreshUserType: checkUserType };
};