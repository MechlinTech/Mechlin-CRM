-- ============================================
-- RBAC MIGRATION - SAFE VERSION
-- This handles existing tables properly
-- ============================================

-- Step 1: Drop existing RBAC tables if they exist (they might be incomplete)
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;

-- Step 2: Create Permissions Table (fresh)
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

-- Step 3: Create Role Permissions Junction Table
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- Step 6: Create User Roles Junction Table (multiple roles per user)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- Step 7: Create User Permissions Table
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission_id)
);

-- Step 5: Create Indexes for Performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_roles_organisation_id ON roles(organisation_id);
CREATE INDEX idx_roles_is_system_role ON roles(is_system_role);

-- Step 6: Create Trigger Function for Auto-Creating Users
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

-- Step 7: Create Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SEED DATA: Default System Roles
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
    ('sprints.delete', 'Delete Sprints', 'Can delete sprints', 'sprints', 'delete');

-- ============================================
-- DEFAULT ROLE PERMISSIONS MAPPING
-- ============================================
-- Super Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM permissions;

-- Admin: All except some system-level operations
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM permissions
WHERE name NOT IN ('organisations.delete');

-- Project Manager: Project-related permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000003', id FROM permissions
WHERE module IN ('projects', 'documents', 'phases', 'milestones', 'sprints', 'wiki', 'threads')
   OR name IN ('users.read', 'invoices.read', 'invoices.create');

-- Developer: Development-related permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000004', id FROM permissions
WHERE name IN (
    'projects.read', 'documents.read', 'documents.create', 'documents.update',
    'phases.read', 'milestones.read', 'milestones.update',
    'sprints.read', 'sprints.update', 'sprints.create',
    'wiki.read', 'wiki.create', 'wiki.update',
    'threads.read', 'threads.create', 'threads.update'
);

-- QA Engineer: Testing-related permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000005', id FROM permissions
WHERE name IN (
    'projects.read', 'documents.read', 'documents.create',
    'phases.read', 'milestones.read', 'milestones.update',
    'sprints.read', 'sprints.update',
    'wiki.read', 'wiki.create', 'wiki.update',
    'threads.read', 'threads.create', 'threads.update'
);

-- BD: Business development permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000006', id FROM permissions
WHERE name IN (
    'projects.read', 'projects.create',
    'organisations.read', 'organisations.create',
    'documents.read', 'invoices.read', 'invoices.create',
    'users.read'
);

-- Finance: Finance-related permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000007', id FROM permissions
WHERE name IN (
    'projects.read', 'invoices.create', 'invoices.read', 
    'invoices.update', 'invoices.delete',
    'organisations.read', 'documents.read'
);

-- ============================================
-- VERIFICATION - Check everything worked
-- ============================================
SELECT '✅ RBAC Tables Created' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('permissions', 'role_permissions', 'user_roles')
AND table_schema = 'public';

SELECT '✅ System Roles Created' as status;
SELECT name, display_name FROM roles WHERE is_system_role = true ORDER BY name;

SELECT '✅ Permissions Count' as status;
SELECT COUNT(*) as total_permissions FROM permissions;

SELECT '✅ Trigger Created' as status;
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
