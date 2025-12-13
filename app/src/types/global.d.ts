declare module 'react-native-vector-icons/Feather' {
 import { Component } from 'react';
 import { TextStyle } from 'react-native';

 interface IconProps {
  name: string;
  size?: number;

  style?: TextStyle;
 }

 export default class Icon extends Component<IconProps> {}
}

declare module '@supabase/supabase-js' {
 export interface User {
  id: string;
  email?: string;
  [key: string]: any;
 }

 export interface Session {
  user: User;
  [key: string]: any;
 }

 export interface AuthResponse {
  data: {
   user: User | null;
   session: Session | null;
  };
  error: any;
 }

 export interface AuthClient {
  signUp(options: { email: string; password: string }): Promise<AuthResponse>;
  signInWithPassword(options: { email: string; password: string }): Promise<AuthResponse>;
  signOut(): Promise<{ error: any }>;
  getUser(): Promise<{ data: { user: User | null }; error: any }>;
  getSession(): Promise<{ data: { session: Session | null }; error: any }>;
  onAuthStateChange(callback: (event: string, session: Session | null) => void): { data: { subscription: { unsubscribe: () => void } } };
 }
}