# RBAC Implementation Examples

This file shows practical examples of adding RBAC protection to your existing CRM pages and components.

## Example 1: Protect Project Creation Page

### Before (No Protection)
```tsx
// app/(authenticated)/projects/create/page.tsx
export default async function CreateProjectPage() {
    return (
        <div>
            <h1>Create New Project</h1>
            <CreateProjectForm />
        </div>
    )
}
```

### After (With RBAC Protection)
```tsx
// app/(authenticated)/projects/create/page.tsx
import { requirePermission } from '@/lib/rbac-middleware'

export default async function CreateProjectPage() {
    // Only users with 'projects.create' permission can access this page
    await requirePermission('projects.create')
    
    return (
        <div>
            <h1>Create New Project</h1>
            <CreateProjectForm />
        </div>
    )
}
```

## Example 2: Protect Project Actions

### Before
```tsx
// src/actions/projects.ts
export async function createProjectAction(data: ProjectInput) {
    const { error } = await createProject(data)
    
    if (error) {
        return { success: false, error: error.message }
    }
    
    revalidatePath("/projects")
    return { success: true }
}
```

### After
```tsx
// src/actions/projects.ts
import { requirePermission } from '@/lib/rbac-middleware'

export async function createProjectAction(data: ProjectInput) {
    // Check permission before allowing action
    await requirePermission('projects.create')
    
    const { error } = await createProject(data)
    
    if (error) {
        return { success: false, error: error.message }
    }
    
    revalidatePath("/projects")
    return { success: true }
}

export async function updateProjectAction(id: string, data: ProjectInput) {
    await requirePermission('projects.update')
    // ... update logic
}

export async function deleteProjectAction(id: string) {
    await requirePermission('projects.delete')
    // ... delete logic
}
```

## Example 3: Conditional UI Elements in Projects Page

### Before
```tsx
// app/(authenticated)/projects/page.tsx
export default async function ProjectsPage() {
    const projects = await getAllProjectsAction()
    
    return (
        <div>
            <div className="header">
                <h1>Projects</h1>
                <AddProjectButton />
            </div>
            <ProjectsTable projects={projects.projects || []} />
        </div>
    )
}
```

### After (Show button only to authorized users)
```tsx
// app/(authenticated)/projects/page.tsx
import { HasPermission } from '@/components/shared/permission-gate'

export default async function ProjectsPage() {
    const projects = await getAllProjectsAction()
    
    return (
        <div>
            <div className="header">
                <h1>Projects</h1>
                {/* Only show create button to users with permission */}
                <HasPermission permission="projects.create">
                    <AddProjectButton />
                </HasPermission>
            </div>
            <ProjectsTable projects={projects.projects || []} />
        </div>
    )
}
```

## Example 4: Project Actions Menu

### Before
```tsx
// components/custom/projects/project-actions.tsx
export function ProjectActions({ project }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem>View</DropdownMenuItem>
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Delete</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
```

### After (Permission-based actions)
```tsx
// components/custom/projects/project-actions.tsx
"use client"

import { usePermissions } from '@/hooks/usePermissions'
import { HasPermission } from '@/components/shared/permission-gate'

export function ProjectActions({ project }) {
    const { hasPermission } = usePermissions()
    
    // Don't show menu if user has no permissions
    if (!hasPermission('projects.update') && !hasPermission('projects.delete')) {
        return null
    }
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
            <DropdownMenuContent>
                {/* Everyone can view */}
                <DropdownMenuItem>View</DropdownMenuItem>
                
                {/* Only show edit to users with permission */}
                <HasPermission permission="projects.update">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                </HasPermission>
                
                {/* Only show delete to users with permission */}
                <HasPermission permission="projects.delete">
                    <DropdownMenuItem className="text-red-600">
                        Delete
                    </DropdownMenuItem>
                </HasPermission>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
```

## Example 5: Organisations Page (Admin Only)

### Before
```tsx
// app/(authenticated)/organisations/page.tsx
export default async function OrganisationsPage() {
    const organisations = await getAllOrganisationsAction()
    
    return (
        <div>
            <h1>Organisations</h1>
            <OrganisationsTable organisations={organisations.organisations || []} />
        </div>
    )
}
```

### After (Admin only access)
```tsx
// app/(authenticated)/organisations/page.tsx
import { requireAdmin } from '@/lib/rbac-middleware'

export default async function OrganisationsPage() {
    // Only admins can access this page
    await requireAdmin()
    
    const organisations = await getAllOrganisationsAction()
    
    return (
        <div>
            <h1>Organisations</h1>
            <OrganisationsTable organisations={organisations.organisations || []} />
        </div>
    )
}
```

## Example 6: Documents Page with Multiple Permission Checks

### Before
```tsx
// app/(authenticated)/projects/[id]/documents/page.tsx
export default async function DocumentsPage({ params }) {
    const documents = await getProjectDocuments(params.id)
    
    return (
        <div>
            <h1>Project Documents</h1>
            <UploadButton />
            <DocumentsList documents={documents} />
        </div>
    )
}
```

### After (Read permission required, upload button conditional)
```tsx
// app/(authenticated)/projects/[id]/documents/page.tsx
import { requirePermission } from '@/lib/rbac-middleware'
import { HasPermission } from '@/components/shared/permission-gate'

export default async function DocumentsPage({ params }) {
    // User needs read permission to view this page
    await requirePermission('documents.read')
    
    const documents = await getProjectDocuments(params.id)
    
    return (
        <div>
            <h1>Project Documents</h1>
            
            {/* Only show upload button to users who can create documents */}
            <HasPermission permission="documents.create">
                <UploadButton />
            </HasPermission>
            
            <DocumentsList documents={documents} />
        </div>
    )
}
```

## Example 7: Sidebar Navigation with Permissions

### Before
```tsx
// components/shared/app-sidebar.tsx
export function AppSidebar() {
    return (
        <nav>
            <NavItem href="/dashboard">Dashboard</NavItem>
            <NavItem href="/projects">Projects</NavItem>
            <NavItem href="/users">Users</NavItem>
            <NavItem href="/organisations">Organisations</NavItem>
        </nav>
    )
}
```

### After (Permission-based navigation)
```tsx
// components/shared/app-sidebar.tsx
"use client"

import { usePermissions } from '@/hooks/usePermissions'

export function AppSidebar() {
    const { hasPermission, isAdmin } = usePermissions()
    
    return (
        <nav>
            {/* Always show dashboard */}
            <NavItem href="/dashboard">Dashboard</NavItem>
            
            {/* Show projects if user can read them */}
            {hasPermission('projects.read') && (
                <NavItem href="/projects">Projects</NavItem>
            )}
            
            {/* Show users if user can read them */}
            {hasPermission('users.read') && (
                <NavItem href="/users">Users</NavItem>
            )}
            
            {/* Show organisations only to admins */}
            {isAdmin && (
                <NavItem href="/organisations">Organisations</NavItem>
            )}
        </nav>
    )
}
```

## Example 8: Form Fields Based on Permissions

```tsx
// components/custom/projects/create-project-form.tsx
"use client"

import { usePermissions } from '@/hooks/usePermissions'

export function CreateProjectForm() {
    const { hasPermission } = usePermissions()
    const canManageBudget = hasPermission('projects.manage_budget')
    const canAssignMembers = hasPermission('projects.manage_members')
    
    return (
        <form>
            {/* Basic fields - everyone can fill these */}
            <Input name="name" label="Project Name" required />
            <Textarea name="description" label="Description" />
            
            {/* Budget field - only for users with budget permission */}
            {canManageBudget && (
                <Input 
                    name="budget" 
                    label="Budget" 
                    type="number" 
                />
            )}
            
            {/* Team assignment - only for users with member management permission */}
            {canAssignMembers && (
                <TeamMemberSelector />
            )}
            
            <Button type="submit">Create Project</Button>
        </form>
    )
}
```

## Example 9: API Route Protection

```typescript
// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac-middleware'

export async function GET(request: NextRequest) {
    // Check permission before processing
    const user = await requirePermission('projects.read')
    
    // Fetch projects...
    const projects = await getProjects()
    
    return NextResponse.json({ projects })
}

export async function POST(request: NextRequest) {
    // Check permission before processing
    const user = await requirePermission('projects.create')
    
    const body = await request.json()
    
    // Create project...
    const project = await createProject(body)
    
    return NextResponse.json({ project })
}
```

## Example 10: Complex Permission Logic

```tsx
// components/custom/projects/project-card.tsx
"use client"

import { usePermissions } from '@/hooks/usePermissions'

export function ProjectCard({ project }) {
    const { hasPermission, hasAnyPermission, isSuperAdmin } = usePermissions()
    
    // Check if user can perform any actions
    const canEdit = hasPermission('projects.update')
    const canDelete = hasPermission('projects.delete')
    const canManageMembers = hasPermission('projects.manage_members')
    
    // Super admins can do everything
    const canPerformActions = isSuperAdmin || hasAnyPermission([
        'projects.update',
        'projects.delete',
        'projects.manage_members'
    ])
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{project.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{project.description}</p>
            </CardContent>
            
            {canPerformActions && (
                <CardFooter>
                    {canEdit && <Button>Edit</Button>}
                    {canManageMembers && <Button>Manage Team</Button>}
                    {canDelete && <Button variant="destructive">Delete</Button>}
                </CardFooter>
            )}
        </Card>
    )
}
```

## Summary

### Server-Side Protection (Pages & API)
```tsx
import { 
    requirePermission,
    requireRole,
    requireAdmin,
    checkPermission 
} from '@/lib/rbac-middleware'

// Redirect if no permission
await requirePermission('module.action')

// Check without redirect
const canDo = await checkPermission('module.action')

// Require admin
await requireAdmin()
```

### Client-Side Conditional Rendering
```tsx
import { usePermissions } from '@/hooks/usePermissions'
import { HasPermission, AdminOnly } from '@/components/shared/permission-gate'

// Using hook
const { hasPermission, isAdmin } = usePermissions()

// Using component
<HasPermission permission="module.action">
    <Component />
</HasPermission>
```

### Server Actions
```tsx
import { requirePermission } from '@/lib/rbac-middleware'

export async function myAction() {
    await requirePermission('module.action')
    // ... action logic
}
```

## Testing Checklist

- [ ] Create test users with different roles
- [ ] Verify each role sees appropriate UI elements
- [ ] Test that protected pages redirect unauthorized users
- [ ] Verify server actions reject unauthorized requests
- [ ] Test navigation items show/hide correctly
- [ ] Verify form fields appear/disappear based on permissions
- [ ] Test API routes with different permission levels

---

**Use these examples as templates** to add RBAC protection throughout your application!
