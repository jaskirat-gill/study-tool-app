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

// Document Upload interface for storing raw documents
export interface DocumentUpload {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  created: Date;
  lastModified: Date;
  description?: string;
}