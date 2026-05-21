-- UPMIND OS MVP - Database Schema
-- Run in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- 1. USERS (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'client')),
  team_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TEAMS
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from users to teams
ALTER TABLE public.users
  ADD CONSTRAINT fk_users_team
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- 3. CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  logo_url TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  color TEXT NOT NULL DEFAULT '#132A85',
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. DEMANDS
CREATE TABLE IF NOT EXISTS public.demands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'task' CHECK (type IN ('task', 'design', 'copy', 'video', 'social', 'other')),
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in_progress', 'review', 'approved', 'delivered', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  due_date DATE,
  estimated_hours NUMERIC(6,2),
  actual_hours NUMERIC(6,2),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. COMMENTS
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demand_id UUID NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. FILES
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demand_id UUID NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  is_deliverable BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. STATUS_HISTORY
CREATE TABLE IF NOT EXISTS public.status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demand_id UUID NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_team_id ON public.users(team_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_clients_team_id ON public.clients(team_id);
CREATE INDEX idx_projects_team_id ON public.projects(team_id);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_demands_team_id ON public.demands(team_id);
CREATE INDEX idx_demands_project_id ON public.demands(project_id);
CREATE INDEX idx_demands_client_id ON public.demands(client_id);
CREATE INDEX idx_demands_assigned_to ON public.demands(assigned_to);
CREATE INDEX idx_demands_status ON public.demands(status);
CREATE INDEX idx_demands_due_date ON public.demands(due_date);
CREATE INDEX idx_comments_demand_id ON public.comments(demand_id);
CREATE INDEX idx_comments_author_id ON public.comments(author_id);
CREATE INDEX idx_files_demand_id ON public.files(demand_id);
CREATE INDEX idx_status_history_demand_id ON public.status_history(demand_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_demands_updated_at
  BEFORE UPDATE ON public.demands
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- STATUS HISTORY TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_demand_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.status_history (demand_id, changed_by, from_status, to_status)
    VALUES (NEW.id, NEW.assigned_to, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_demands_status_history
  AFTER UPDATE ON public.demands
  FOR EACH ROW EXECUTE FUNCTION public.record_demand_status_change();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's team_id
CREATE OR REPLACE FUNCTION public.my_team_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT team_id FROM public.users WHERE id = auth.uid();
$$;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- USERS policies
CREATE POLICY "users_select_same_team" ON public.users
  FOR SELECT USING (team_id = public.my_team_id() OR id = auth.uid());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "users_insert_admin" ON public.users
  FOR INSERT WITH CHECK (public.my_role() IN ('admin', 'manager'));

-- TEAMS policies
CREATE POLICY "teams_select_member" ON public.teams
  FOR SELECT USING (id = public.my_team_id());

CREATE POLICY "teams_update_owner" ON public.teams
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "teams_insert_auth" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- CLIENTS policies
CREATE POLICY "clients_select_team" ON public.clients
  FOR SELECT USING (team_id = public.my_team_id());

CREATE POLICY "clients_insert_manager" ON public.clients
  FOR INSERT WITH CHECK (team_id = public.my_team_id() AND public.my_role() IN ('admin', 'manager'));

CREATE POLICY "clients_update_manager" ON public.clients
  FOR UPDATE USING (team_id = public.my_team_id() AND public.my_role() IN ('admin', 'manager'));

CREATE POLICY "clients_delete_admin" ON public.clients
  FOR DELETE USING (team_id = public.my_team_id() AND public.my_role() = 'admin');

-- PROJECTS policies
CREATE POLICY "projects_select_team" ON public.projects
  FOR SELECT USING (team_id = public.my_team_id());

CREATE POLICY "projects_insert_manager" ON public.projects
  FOR INSERT WITH CHECK (team_id = public.my_team_id() AND public.my_role() IN ('admin', 'manager'));

CREATE POLICY "projects_update_manager" ON public.projects
  FOR UPDATE USING (team_id = public.my_team_id() AND public.my_role() IN ('admin', 'manager'));

CREATE POLICY "projects_delete_admin" ON public.projects
  FOR DELETE USING (team_id = public.my_team_id() AND public.my_role() = 'admin');

-- DEMANDS policies
CREATE POLICY "demands_select_team" ON public.demands
  FOR SELECT USING (team_id = public.my_team_id());

CREATE POLICY "demands_insert_team" ON public.demands
  FOR INSERT WITH CHECK (team_id = public.my_team_id());

CREATE POLICY "demands_update_team" ON public.demands
  FOR UPDATE USING (
    team_id = public.my_team_id() AND (
      public.my_role() IN ('admin', 'manager') OR
      assigned_to = auth.uid() OR
      created_by = auth.uid()
    )
  );

CREATE POLICY "demands_delete_manager" ON public.demands
  FOR DELETE USING (team_id = public.my_team_id() AND public.my_role() IN ('admin', 'manager'));

-- COMMENTS policies
CREATE POLICY "comments_select_team" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.demands d
      WHERE d.id = demand_id AND d.team_id = public.my_team_id()
    ) AND (
      NOT is_internal OR public.my_role() IN ('admin', 'manager', 'member')
    )
  );

CREATE POLICY "comments_insert_team" ON public.comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.demands d
      WHERE d.id = demand_id AND d.team_id = public.my_team_id()
    )
  );

CREATE POLICY "comments_update_own" ON public.comments
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "comments_delete_own_or_admin" ON public.comments
  FOR DELETE USING (author_id = auth.uid() OR public.my_role() IN ('admin', 'manager'));

-- FILES policies
CREATE POLICY "files_select_team" ON public.files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.demands d
      WHERE d.id = demand_id AND d.team_id = public.my_team_id()
    )
  );

CREATE POLICY "files_insert_team" ON public.files
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.demands d
      WHERE d.id = demand_id AND d.team_id = public.my_team_id()
    )
  );

CREATE POLICY "files_delete_uploader_or_admin" ON public.files
  FOR DELETE USING (
    uploaded_by = auth.uid() OR public.my_role() IN ('admin', 'manager')
  );

-- STATUS_HISTORY policies
CREATE POLICY "status_history_select_team" ON public.status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.demands d
      WHERE d.id = demand_id AND d.team_id = public.my_team_id()
    )
  );

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'demand-files',
  'demand-files',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf',
        'video/mp4','video/quicktime','application/zip',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_select_team" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'demand-files' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "storage_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'demand-files' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "storage_delete_uploader" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'demand-files' AND
    owner = auth.uid()::text
  );
