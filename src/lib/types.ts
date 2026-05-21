export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'admin' | 'manager' | 'member' | 'client';
export type DemandStatus = 'backlog' | 'in_progress' | 'review' | 'approved' | 'delivered' | 'cancelled';
export type DemandType = 'task' | 'design' | 'copy' | 'video' | 'social' | 'other';
export type DemandPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Team, 'id' | 'created_at'>>;
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Client, 'id' | 'created_at'>>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at'>>;
      };
      demands: {
        Row: Demand;
        Insert: Omit<Demand, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Demand, 'id' | 'created_at'>>;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Comment, 'id' | 'created_at'>>;
      };
      files: {
        Row: File;
        Insert: Omit<File, 'id' | 'created_at'>;
        Update: Partial<Omit<File, 'id' | 'created_at'>>;
      };
      status_history: {
        Row: StatusHistory;
        Insert: Omit<StatusHistory, 'id' | 'created_at'>;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: {
      my_team_id: { Args: Record<string, never>; Returns: string };
      my_role: { Args: Record<string, never>; Returns: string };
    };
    Enums: Record<string, never>;
  };
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  team_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  owner_id: string;
  settings: Json;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  team_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  team_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Demand {
  id: string;
  team_id: string;
  project_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  type: DemandType;
  status: DemandStatus;
  priority: DemandPriority;
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  tags: string[];
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface DemandWithRelations extends Demand {
  assignee?: User | null;
  creator?: User | null;
  client?: Client | null;
  project?: Project | null;
  comments_count?: number;
  files_count?: number;
}

export interface Comment {
  id: string;
  demand_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentWithAuthor extends Comment {
  author: User;
  replies?: CommentWithAuthor[];
}

export interface File {
  id: string;
  demand_id: string;
  uploaded_by: string;
  name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  is_deliverable: boolean;
  version: number;
  created_at: string;
}

export interface FileWithUploader extends File {
  uploader: User;
  url?: string;
}

export interface StatusHistory {
  id: string;
  demand_id: string;
  changed_by: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

// Filter/query types
export interface DemandFilters {
  status?: DemandStatus;
  type?: DemandType;
  priority?: DemandPriority;
  assigned_to?: string;
  client_id?: string;
  project_id?: string;
  search?: string;
  due_before?: string;
  due_after?: string;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  user: User;
}
