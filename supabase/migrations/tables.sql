-- ============================================
-- MECHLIN CRM - UNIFIED DATABASE MIGRATION
-- ============================================
-- This migration combines all schema setup:
-- 1. Core Tables (organisations, users, projects, etc.)
-- 2. RBAC System (roles, permissions, user_roles)
-- 3. User Invites System
-- ============================================

-- ============================================
-- PART 1: CORE TABLES
-- ============================================

-- Organisations
CREATE TABLE IF NOT EXISTS organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    escalation_contacts JSONB DEFAULT '[]',
    is_internal BOOLEAN DEFAULT FALSE, 
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, organisation_id)
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    repo_link TEXT,
    start_date DATE,
    expected_end_date DATE,
    budget NUMERIC,
    currency VARCHAR(10) DEFAULT 'USD',
    status TEXT CHECK (status IN ('Active', 'Pending', 'Suspended')) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Phases
CREATE TABLE IF NOT EXISTS phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Milestones
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    deliverables TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    hours NUMERIC,
    budget NUMERIC, 
    status TEXT CHECK (status IN ('Active', 'Closed', 'Backlog', 'Payment Pending', 'Payment Done')) DEFAULT 'Backlog',
    demo_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sprints
CREATE TABLE IF NOT EXISTS sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Status Logs
CREATE TABLE IF NOT EXISTS status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID NOT NULL,
    target_type TEXT CHECK (target_type IN ('project', 'milestone', 'sprint', 'document')), 
    action_type TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        phase_id UUID REFERENCES phases(id) ON DELETE SET NULL,
    milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,

    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    status TEXT CHECK (status IN ('Draft', 'Pending Review', 'Approved', 'Changes Requested')),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE,
    amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('Sent', 'Paid', 'Overdue')) DEFAULT 'Sent',
    file_url TEXT,
    storage_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Project Members
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- Wiki Pages
CREATE TABLE IF NOT EXISTS wiki_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}',
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES wiki_pages(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wiki Versions
CREATE TABLE IF NOT EXISTS wiki_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES wiki_pages(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    changes_summary TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enquiry Threads
CREATE TABLE IF NOT EXISTS enquiry_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    context_type TEXT NOT NULL CHECK (context_type IN ('project', 'support', 'user', 'general')),
    context_id UUID,
    phase_id UUID REFERENCES phases(id) ON DELETE SET NULL,
    milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enquiry Messages
CREATE TABLE IF NOT EXISTS enquiry_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES enquiry_threads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file')),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thread Participants
CREATE TABLE IF NOT EXISTS thread_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES enquiry_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(thread_id, user_id)
);

-- Thread Attachments
CREATE TABLE IF NOT EXISTS thread_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES enquiry_messages(id) ON DELETE CASCADE,
    thread_id UUID NOT NULL REFERENCES enquiry_threads(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT attachments_file_size_positive CHECK (file_size > 0)
);

-- ============================================
-- PART 2: RBAC SYSTEM
-- ============================================

-- Drop existing RBAC tables if they exist (for clean migration)
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;

-- Permissions Table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Role Permissions Junction Table
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- User Roles Junction Table
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- User Permissions Table (for direct permission assignments)
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission_id)
);

-- ============================================
-- PART 3: USER INVITES SYSTEM
-- ============================================

-- User Invites Table
CREATE TABLE IF NOT EXISTS user_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Wiki Indexes
CREATE INDEX IF NOT EXISTS idx_wiki_pages_parent_id ON wiki_pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_slug ON wiki_pages(slug);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_status ON wiki_pages(status);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_project_id ON wiki_pages(project_id);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_project_status ON wiki_pages(project_id, status);
CREATE INDEX IF NOT EXISTS idx_wiki_versions_page_id ON wiki_versions(page_id);

-- Thread Indexes
CREATE INDEX IF NOT EXISTS idx_threads_status ON enquiry_threads(status);
CREATE INDEX IF NOT EXISTS idx_threads_context ON enquiry_threads(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON enquiry_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_last_message ON enquiry_threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_created_by ON enquiry_threads(created_by);
CREATE INDEX IF NOT EXISTS idx_enquiry_threads_phase_id ON enquiry_threads(phase_id);
CREATE INDEX IF NOT EXISTS idx_enquiry_threads_milestone_id ON enquiry_threads(milestone_id);
CREATE INDEX IF NOT EXISTS idx_enquiry_threads_sprint_id ON enquiry_threads(sprint_id);
CREATE INDEX IF NOT EXISTS idx_enquiry_threads_hierarchy ON enquiry_threads(context_id, phase_id, milestone_id, sprint_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON enquiry_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_created_by ON enquiry_messages(created_by);
CREATE INDEX IF NOT EXISTS idx_participants_thread_id ON thread_participants(thread_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON thread_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON thread_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_thread_id ON thread_attachments(thread_id);

-- RBAC Indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_roles_organisation_id ON roles(organisation_id);
CREATE INDEX IF NOT EXISTS idx_roles_is_system_role ON roles(is_system_role);

-- User Invites Indexes
CREATE INDEX IF NOT EXISTS idx_user_invites_email ON user_invites(email);
CREATE INDEX IF NOT EXISTS idx_user_invites_organisation_id ON user_invites(organisation_id);
CREATE INDEX IF NOT EXISTS idx_user_invites_status ON user_invites(status);
CREATE INDEX IF NOT EXISTS idx_user_invites_invited_by ON user_invites(invited_by);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-create users from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, status, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'active',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Update user_invites updated_at
CREATE OR REPLACE FUNCTION update_user_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_invites_updated_at ON user_invites;
CREATE TRIGGER trigger_update_user_invites_updated_at
    BEFORE UPDATE ON user_invites
    FOR EACH ROW
    EXECUTE FUNCTION update_user_invites_updated_at();

-- Expire old invites function
CREATE OR REPLACE FUNCTION expire_old_invites()
RETURNS void AS $$
BEGIN
    UPDATE user_invites
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on user_invites
ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view invites in their organisation
CREATE POLICY "Users can view invites in their organisation"
    ON user_invites FOR SELECT
    USING (
        organisation_id IN (
            SELECT organisation_id FROM users WHERE id = auth.uid()
        )
    );

-- RLS Policy: Users with manage_users permission can insert invites
CREATE POLICY "Users with manage_users permission can insert invites"
    ON user_invites FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM user_roles ur
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE p.name = 'users.create' OR p.name = 'users.assign_roles'
        )
    );

-- RLS Policy: Users with manage_users permission can update invites
CREATE POLICY "Users with manage_users permission can update invites"
    ON user_invites FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles ur
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE p.name = 'users.update' OR p.name = 'users.assign_roles'
        )
    );

-- ============================================
-- SEED DATA: System Roles
-- ============================================
INSERT INTO roles (id, organisation_id, name, display_name, description, is_system_role, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001', NULL, 'super_admin', 'Super Admin', 'Full system access - Mechlin internal only', true, true),
    ('00000000-0000-0000-0000-000000000002', NULL, 'admin', 'Admin', 'Organisation administrator', true, true),
    ('00000000-0000-0000-0000-000000000003', NULL, 'pm', 'Project Manager', 'Manages projects and teams', true, true),
    ('00000000-0000-0000-0000-000000000004', NULL, 'dev', 'Developer', 'Development team member', true, true),
    ('00000000-0000-0000-0000-000000000005', NULL, 'qa', 'QA Engineer', 'Quality assurance engineer', true, true),
    ('00000000-0000-0000-0000-000000000006', NULL, 'bd', 'Business Development', 'Business development team member', true, true),
    ('00000000-0000-0000-0000-000000000007', NULL, 'finance', 'Finance', 'Finance team member', true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SEED DATA: Permissions
-- ============================================
INSERT INTO permissions (name, display_name, description, module, action) VALUES
    -- Projects
    ('projects.create', 'Create Projects', 'Can create new projects', 'projects', 'create'),
    ('projects.read', 'View Projects', 'Can view project details', 'projects', 'read'),
    ('projects.update', 'Update Projects', 'Can edit project information', 'projects', 'update'),
    ('projects.delete', 'Delete Projects', 'Can delete projects', 'projects', 'delete'),
    ('projects.manage_members', 'Manage Project Members', 'Can add/remove project members', 'projects', 'manage'),
    
    -- Users
    ('users.create', 'Create Users', 'Can create new users', 'users', 'create'),
    ('users.read', 'View Users', 'Can view user information', 'users', 'read'),
    ('users.update', 'Update Users', 'Can edit user information', 'users', 'update'),
    ('users.delete', 'Delete Users', 'Can delete users', 'users', 'delete'),
    ('users.assign_roles', 'Assign User Roles', 'Can assign roles to users', 'users', 'manage'),
    
    -- Organisations
    ('organisations.create', 'Create Organisations', 'Can create new organisations', 'organisations', 'create'),
    ('organisations.read', 'View Organisations', 'Can view organisation details', 'organisations', 'read'),
    ('organisations.update', 'Update Organisations', 'Can edit organisation information', 'organisations', 'update'),
    ('organisations.delete', 'Delete Organisations', 'Can delete organisations', 'organisations', 'delete'),
    
    -- Roles & Permissions
    ('roles.create', 'Create Roles', 'Can create custom roles', 'roles', 'create'),
    ('roles.read', 'View Roles', 'Can view roles and permissions', 'roles', 'read'),
    ('roles.update', 'Update Roles', 'Can edit role permissions', 'roles', 'update'),
    ('roles.delete', 'Delete Roles', 'Can delete custom roles', 'roles', 'delete'),
    
    -- Documents
    ('documents.create', 'Upload Documents', 'Can upload project documents', 'documents', 'create'),
    ('documents.read', 'View Documents', 'Can view and download documents', 'documents', 'read'),
    ('documents.update', 'Update Documents', 'Can update document status', 'documents', 'update'),
    ('documents.delete', 'Delete Documents', 'Can delete documents', 'documents', 'delete'),
    
    -- Invoices
    ('invoices.create', 'Create Invoices', 'Can create invoices', 'invoices', 'create'),
    ('invoices.read', 'View Invoices', 'Can view invoices', 'invoices', 'read'),
    ('invoices.update', 'Update Invoices', 'Can update invoice status', 'invoices', 'update'),
    ('invoices.delete', 'Delete Invoices', 'Can delete invoices', 'invoices', 'delete'),
    
    -- Wiki
    ('wiki.create', 'Create Wiki Pages', 'Can create wiki pages', 'wiki', 'create'),
    ('wiki.read', 'View Wiki', 'Can view wiki pages', 'wiki', 'read'),
    ('wiki.update', 'Update Wiki', 'Can edit wiki pages', 'wiki', 'update'),
    ('wiki.delete', 'Delete Wiki', 'Can delete wiki pages', 'wiki', 'delete'),
    
    -- Threads
    ('threads.create', 'Create Threads', 'Can create discussion threads', 'threads', 'create'),
    ('threads.read', 'View Threads', 'Can view discussion threads', 'threads', 'read'),
    ('threads.update', 'Update Threads', 'Can update thread status', 'threads', 'update'),
    ('threads.delete', 'Delete Threads', 'Can delete threads', 'threads', 'delete'),
    
    -- Phases, Milestones, Sprints
    ('phases.create', 'Create Phases', 'Can create project phases', 'phases', 'create'),
    ('phases.read', 'View Phases', 'Can view project phases', 'phases', 'read'),
    ('phases.update', 'Update Phases', 'Can edit project phases', 'phases', 'update'),
    ('phases.delete', 'Delete Phases', 'Can delete project phases', 'phases', 'delete'),
    
    ('milestones.create', 'Create Milestones', 'Can create milestones', 'milestones', 'create'),
    ('milestones.read', 'View Milestones', 'Can view milestones', 'milestones', 'read'),
    ('milestones.update', 'Update Milestones', 'Can edit milestones', 'milestones', 'update'),
    ('milestones.delete', 'Delete Milestones', 'Can delete milestones', 'milestones', 'delete'),
    
    ('sprints.create', 'Create Sprints', 'Can create sprints', 'sprints', 'create'),
    ('sprints.read', 'View Sprints', 'Can view sprints', 'sprints', 'read'),
    ('sprints.update', 'Update Sprints', 'Can edit sprints', 'sprints', 'update'),
    ('sprints.delete', 'Delete Sprints', 'Can delete sprints', 'sprints', 'delete')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SEED DATA: Role Permissions Mapping
-- ============================================

-- Super Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM permissions
ON CONFLICT DO NOTHING;

-- Admin: All except organisation deletion
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM permissions
WHERE name NOT IN ('organisations.delete')
ON CONFLICT DO NOTHING;

-- Project Manager: Project-related permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000003', id FROM permissions
WHERE module IN ('projects', 'documents', 'phases', 'milestones', 'sprints', 'wiki', 'threads')
   OR name IN ('users.read', 'invoices.read', 'invoices.create')
ON CONFLICT DO NOTHING;

-- Developer: Development-related permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000004', id FROM permissions
WHERE name IN (
    'projects.read', 'documents.read', 'documents.create', 'documents.update',
    'phases.read', 'milestones.read', 'milestones.update',
    'sprints.read', 'sprints.update', 'sprints.create',
    'wiki.read', 'wiki.create', 'wiki.update',
    'threads.read', 'threads.create', 'threads.update'
)
ON CONFLICT DO NOTHING;

-- QA Engineer: Testing-related permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000005', id FROM permissions
WHERE name IN (
    'projects.read', 'documents.read', 'documents.create',
    'phases.read', 'milestones.read', 'milestones.update',
    'sprints.read', 'sprints.update',
    'wiki.read', 'wiki.create', 'wiki.update',
    'threads.read', 'threads.create', 'threads.update'
)
ON CONFLICT DO NOTHING;

-- BD: Business development permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000006', id FROM permissions
WHERE name IN (
    'projects.read', 'projects.create',
    'organisations.read', 'organisations.create',
    'documents.read', 'invoices.read', 'invoices.create',
    'users.read'
)
ON CONFLICT DO NOTHING;

-- Finance: Finance-related permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000007', id FROM permissions
WHERE name IN (
    'projects.read', 'invoices.create', 'invoices.read', 
    'invoices.update', 'invoices.delete',
    'organisations.read', 'documents.read'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE user_invites IS 'Tracks user invitations before they are authenticated';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
SELECT '✅ Migration Complete!' as status;
SELECT 'All tables, RBAC system, and user invites have been set up successfully.' as message;



-- ADD NEW PERMISSIONS FOR PM UPDATES & TASKS
-- ============================================

INSERT INTO permissions (name, display_name, description, module, action) VALUES
    -- PM Updates (Broadcasts)
    ('pmupdates.create', 'Create PM Updates', 'Can post new project broadcasts', 'pmupdates', 'create'),
    ('pmupdates.read', 'View PM Updates', 'Can view project broadcasts', 'pmupdates', 'read'),
    ('pmupdates.update', 'Update PM Updates', 'Can edit project broadcasts', 'pmupdates', 'update'),
    ('pmupdates.delete', 'Delete PM Updates', 'Can delete project broadcasts', 'pmupdates', 'delete'),
    
    -- Tasks
    ('tasks.create', 'Create Tasks', 'Can create new tasks within sprints', 'tasks', 'create'),
    ('tasks.read', 'View Tasks', 'Can view task details', 'tasks', 'read'),
    ('tasks.update', 'Update Tasks', 'Can edit task information', 'tasks', 'update'),
    ('tasks.delete', 'Delete Tasks', 'Can delete tasks', 'tasks', 'delete')
ON CONFLICT (name) DO NOTHING;



CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);