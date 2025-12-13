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

   // Check if user is a professional/trainer
   const { data: professional } = await supabase
    .from('profissionais')
    .select('id')
    .eq('user_id', user.id)
    .single();

   setUserType(professional ? 'trainer' : 'client');
  } catch (error) {
   console.log('Error checking user type:', error);
   setUserType('client');
  } finally {
   setLoading(false);
  }
 };

 return { userType, loading, refreshUserType: checkUserType };
};