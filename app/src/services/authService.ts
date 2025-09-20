import { supabase } from './supabaseClient';
import { Usuario } from '../types/db';

export interface SignUpData {
  name: string;
  email: string;
  password: string;
}

export const authService = {
  async signUp({ name, email, password }: SignUpData) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (authData.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('usuarios')
        .insert([
          {
            id: authData.user.id,
            nome: name,
            email: email,
          }
        ])
        .select()
        .single();

      if (profileError) throw profileError;
      return { user: authData.user, profile: profileData };
    }

    throw new Error('Failed to create user');
  },

  async signIn(email: string, password: string) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;

    if (authData.user) {
      const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;
      return { user: authData.user, profile };
    }

    throw new Error('Failed to sign in');
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async getCurrentUserProfile(): Promise<Usuario | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return profile;
  }
};