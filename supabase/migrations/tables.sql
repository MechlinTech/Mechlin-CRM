-- 1. Organizations Table
-- Represents the client companies. 
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier (e.g., 'mechlin-tech')
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Roles Table
-- Defines positions like Admin, Dev, QA, etc., separated by 'side'[cite: 4, 12, 13].
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE, 
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    side TEXT CHECK (side IN ('mechlin', 'client')) NOT NULL, -- Distinguishes internal vs external roles [cite: 12]
    permissions JSONB DEFAULT '{}'::jsonb, -- Mapping of specific actions allowed [cite: 41, 101]
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, organization_id, side) -- Allows same role name in different orgs/sides
);

-- 3. User Profiles
-- Extends Supabase auth.users with CRM-specific data[cite: 93].
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    role_id UUID REFERENCES public.roles(id),
    full_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active', -- Active/Inactive status [cite: 48]
    is_mechlin BOOLEAN DEFAULT FALSE, -- Flag for internal Mechlin staff [cite: 86]
    escalation_contact TEXT, -- Required for Client Workspace [cite: 49]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Projects Table
-- Top-level container for all work items[cite: 50, 109].
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    repo_link TEXT, -- Azure DevOps/Repo integration [cite: 26]
    start_date DATE,
    expected_end_date DATE,
    budget NUMERIC,
    currency VARCHAR(10) DEFAULT 'USD', -- Multi-currency support [cite: 17]
    health_status TEXT CHECK (health_status IN ('Green', 'Yellow', 'Red')) DEFAULT 'Green', -- Client dashboard indicator [cite: 67]
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Phases, 6. Milestones, 7. Sprints
-- Visual Hierarchy: Phase -> Milestone -> Sprint[cite: 58, 118].
CREATE TABLE public.phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id UUID REFERENCES public.phases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    deliverables TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    hours NUMERIC,
    budget NUMERIC, -- Budget at milestone level [cite: 59]
    status TEXT CHECK (status IN ('Active', 'Closed', 'Backlog', 'Payment Pending', 'Payment Done')) DEFAULT 'Backlog', [cite: 60]
    demo_date DATE, -- Mandatory demo tracking [cite: 21, 60]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE, -- Optional sprints [cite: 22, 61]
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Documents & Versioning

CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL, -- Cascade layout [cite: 74]
    name TEXT NOT NULL,
    file_url TEXT NOT NULL, -- Supabase Storage link [cite: 73]
    version INT DEFAULT 1, -- Simple version tracking [cite: 78, 139]
    status TEXT CHECK (status IN ('Draft', 'Pending Review', 'Approved', 'Changes Requested')), [cite: 89]
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Status Logs (Audit Trail)
-- Satisfies B7: Status History[cite: 61, 120].
CREATE TABLE public.status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID NOT NULL, -- ID of the Project or Milestone
    target_type TEXT, -- 'project' or 'milestone'
    old_status TEXT,
    new_status TEXT,
    changed_by UUID REFERENCES public.profiles(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Comments Thread
-- Threaded discussions for milestones and sprints[cite: 70, 130].
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES public.sprints(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);  `