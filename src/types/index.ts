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

export * from './db'
export * from './study';
export * from './ai';