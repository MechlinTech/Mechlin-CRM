-- FINAL UNIFIED SCHEMA FOR MECHLIN CRM

CREATE TABLE organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    escalation_contacts JSONB DEFAULT '[]', -- Task 2, 7 & 9
    is_internal BOOLEAN DEFAULT FALSE, 
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- Full Name
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb, -- Task 2 RBAC
    is_active BOOLEAN DEFAULT TRUE,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, organisation_id)
);

CREATE TABLE projects (
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

CREATE TABLE phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE milestones (
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

CREATE TABLE sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT, -- Sprint description
    start_date DATE,
    end_date DATE,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID NOT NULL, -- UUID of the specific project, milestone, or sprint being changed
    target_type TEXT CHECK (target_type IN ('project', 'milestone', 'sprint', 'document')), 
    action_type TEXT NOT NULL, -- e.g., 'CREATE', 'UPDATE', 'DELETE'
    old_value JSONB, -- Snapshot of data before change
    new_value JSONB, -- Snapshot of data after change
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL, -- Added per feedback
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    status TEXT CHECK (status IN ('Draft', 'Pending Review', 'Approved', 'Changes Requested')),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE,
    amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('Sent', 'Paid', 'Overdue')) DEFAULT 'Sent',
    file_url TEXT,
    storage_path TEXT;
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- References the unified users table
    role_id UUID REFERENCES roles(id), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- 7. Wiki Pages Table
CREATE TABLE wiki_pages (
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

-- 8. Wiki Versions Table (for version history)
CREATE TABLE wiki_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES wiki_pages(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    changes_summary TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_wiki_pages_parent_id ON wiki_pages(parent_id);
CREATE INDEX idx_wiki_pages_slug ON wiki_pages(slug);
CREATE INDEX idx_wiki_pages_status ON wiki_pages(status);
CREATE INDEX idx_wiki_pages_project_id ON wiki_pages(project_id);
CREATE INDEX idx_wiki_pages_project_status ON wiki_pages(project_id, status);
CREATE INDEX idx_wiki_versions_page_id ON wiki_versions(page_id);


-- ENQUIRY THREADS TABLE - Main conversation threads
CREATE TABLE enquiry_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    context_type TEXT NOT NULL CHECK (context_type IN ('project', 'support', 'user', 'general')),
    context_id UUID,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
 

-- ENQUIRY MESSAGES TABLE - Messages in threads
CREATE TABLE enquiry_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES enquiry_threads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file')),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
 

-- THREAD PARTICIPANTS TABLE - Users who have participated
CREATE TABLE thread_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES enquiry_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(thread_id, user_id)
);
 

-- THREAD ATTACHMENTS TABLE - Files in threads
CREATE TABLE thread_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES enquiry_messages(id) ON DELETE CASCADE,
    thread_id UUID NOT NULL REFERENCES enquiry_threads(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,       -- URL/path in storage bucket
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT attachments_file_size_positive CHECK (file_size > 0)
);
 

-- PERFORMANCE INDEXES
CREATE INDEX idx_threads_status ON enquiry_threads(status);
CREATE INDEX idx_threads_context ON enquiry_threads(context_type, context_id);
CREATE INDEX idx_threads_created_at ON enquiry_threads(created_at DESC);
CREATE INDEX idx_threads_last_message ON enquiry_threads(last_message_at DESC);
CREATE INDEX idx_threads_created_by ON enquiry_threads(created_by);
 
CREATE INDEX idx_messages_thread_id ON enquiry_messages(thread_id, created_at);
CREATE INDEX idx_messages_created_by ON enquiry_messages(created_by);
 
CREATE INDEX idx_participants_thread_id ON thread_participants(thread_id);
CREATE INDEX idx_participants_user_id ON thread_participants(user_id);
 
CREATE INDEX idx_attachments_message_id ON thread_attachments(message_id);
CREATE INDEX idx_attachments_thread_id ON thread_attachments(thread_id);