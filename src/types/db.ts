export interface User {
  id: string;
  email?: string;
  created_at: string;
  email_confirmed_at?: string;
}

export interface AuthUser {
  user: User | null;
  loading: boolean;
}