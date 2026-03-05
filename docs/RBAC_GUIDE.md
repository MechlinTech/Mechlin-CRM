# Role-Based Access Control (RBAC) Guide

## Overview

This CRM system implements a comprehensive Role-Based Access Control (RBAC) system that allows fine-grained control over what users can access and do within the application.

## Key Features

- **Multiple Roles per User**: Users can have multiple roles assigned
- **Action-Level Permissions**: Permissions are defined at the action level (create, read, update, delete, manage)
- **System & Custom Roles**: Pre-defined system roles + ability to create custom organisation-specific roles
- **Hierarchical Permissions**: Roles contain multiple permissions organized by module
- **Auto-User Creation**: Authenticated users are automatically added to the public.users table via trigger

## Architecture

### Database Tables

1. **permissions** - Defines all available permissions in the system
2. **roles** - Defines roles (both system and custom)
3. **role_permissions** - Junction table linking roles to permissions
4. **user_roles** - Junction table linking users to roles
5. **users** - Public users table synced with auth.users

### Default System Roles

The following system roles are seeded by default:

| Role | Name | Description |
|------|------|-------------|
| Super Admin | `super_admin` | Full system access - Mechlin internal only |
| Admin | `admin` | Organisation administrator |
| Project Manager | `pm` | Manages projects and teams |
| Developer | `dev` | Development team member |
| QA Engineer | `qa` | Quality assurance engineer |
| Business Development | `bd` | Business development team member |
| Finance | `finance` | Finance team member |

### Permission Structure

Permissions follow the format: `module.action`

Examples:
- `projects.create`
- `users.read`
- `documents.update`
- `invoices.delete`

#### Available Modules

- **projects** - Project management
- **users** - User management
- **organisations** - Organisation management
- **roles** - Role and permission management
- **documents** - Document management
- **invoices** - Invoice management
- **wiki** - Wiki/documentation
- **threads** - Discussion threads
- **phases** - Project phases
- **milestones** - Project milestones
- **sprints** - Sprint management

#### Available Actions

- **create** - Create new resources
- **read** - View/read resources
- **update** - Edit/update resources
- **delete** - Delete resources
- **manage** - Special management permissions (e.g., assign roles, manage members)

## Usage

### 1. Managing Roles (UI)

Navigate to **User Management → Role Based Permissions**

#### Creating a Custom Role

1. Click "Create Role" button
2. Fill in role details:
   - Display Name (e.g., "Project Manager")
   - Internal Name (e.g., "project_manager" - lowercase with underscores)
   - Description
3. Select permissions by module
4. Click "Create Role"

#### Editing a Role

1. Click the actions menu (⋮) on any role
2. Select "Edit"
3. Update role information or permissions
4. Click "Update Role"

**Note**: System roles cannot be deleted but can be edited to update permissions.

### 2. Assigning Roles to Users

Navigate to **User Management → Users**

1. Click the actions menu (⋮) on any user
2. Select "Manage Roles"
3. Select/deselect roles
4. Click "Save Changes"

### 3. Using Permissions in Code

#### Client-Side Components

##### Using the Hook

```tsx
import { usePermissions } from '@/hooks/usePermissions'

function MyComponent() {
  const { hasPermission, hasRole, isAdmin } = usePermissions()

  if (hasPermission('projects.create')) {
    return <CreateProjectButton />
  }

  return null
}
```

##### Using Permission Gate Component

```tsx
import { PermissionGate, HasPermission, AdminOnly } from '@/components/shared/permission-gate'

function MyComponent() {
  return (
    <div>
      {/* Show button only to users with projects.create permission */}
      <HasPermission permission="projects.create">
        <CreateProjectButton />
      </HasPermission>

      {/* Show content if user has ANY of these permissions */}
      <PermissionGate permissions={['projects.update', 'projects.delete']}>
        <ProjectActions />
      </PermissionGate>

      {/* Show content if user has ALL these permissions */}
      <PermissionGate 
        permissions={['projects.update', 'projects.delete']} 
        requireAll={true}
      >
        <AdvancedProjectActions />
      </PermissionGate>

      {/* Show admin-only content */}
      <AdminOnly>
        <AdminPanel />
      </AdminOnly>
    </div>
  )
}
```

#### Server-Side (Pages & API Routes)

##### Protecting Pages

```tsx
// app/(authenticated)/projects/create/page.tsx
import { requirePermission } from '@/lib/rbac-middleware'

export default async function CreateProjectPage() {
  // Redirect to /unauthorized if user doesn't have permission
  await requirePermission('projects.create')

  return <CreateProjectForm />
}
```

##### Multiple Permission Checks

```tsx
import { requireAnyPermission, requireAllPermissions } from '@/lib/rbac-middleware'

// User needs ANY of these permissions
await requireAnyPermission(['projects.create', 'projects.update'])

// User needs ALL these permissions
await requireAllPermissions(['projects.update', 'projects.delete'])
```

##### Role-Based Protection

```tsx
import { requireRole, requireAdmin, requireSuperAdmin } from '@/lib/rbac-middleware'

// Require specific role
await requireRole('pm')

// Require admin or super admin
await requireAdmin()

// Require super admin only
await requireSuperAdmin()
```

##### Checking Without Redirect

```tsx
import { checkPermission, checkRole } from '@/lib/rbac-middleware'

const canCreate = await checkPermission('projects.create')
const isAdmin = await checkRole('admin')

if (canCreate) {
  // Show create button
}
```

#### Server Actions

```tsx
'use server'

import { requirePermission } from '@/lib/rbac-middleware'

export async function createProject(data: ProjectInput) {
  // Check permission before processing
  await requirePermission('projects.create')

  // Create project...
}
```

### 4. Direct Database Queries

#### Get User Permissions

```typescript
import { getUserPermissions, checkUserPermission } from '@/data/rbac'

// Get all permissions for a user
const { data: permissions } = await getUserPermissions(userId)
// Returns: ['projects.create', 'projects.read', ...]

// Check specific permission
const { hasPermission } = await checkUserPermission(userId, 'projects.create')
// Returns: { hasPermission: true/false }
```

#### Get User Roles

```typescript
import { getUserRoles } from '@/data/rbac'

const { data: userRoles } = await getUserRoles(userId)
// Returns user_roles with populated role information
```

## Best Practices

### 1. Permission Naming

- Use clear, descriptive names: `projects.create`, not `proj.c`
- Follow the `module.action` format consistently
- Keep module names plural: `projects`, not `project`

### 2. Role Design

- Create roles based on job functions, not individuals
- Keep roles focused and specific
- Use role hierarchy when possible (e.g., Admin includes all PM permissions)
- Document role purposes clearly

### 3. Security

- Always check permissions on the server side
- Use client-side checks only for UI convenience
- Protect API routes with permission checks
- Log permission-related errors for security monitoring

### 4. Performance

- The `usePermissions` hook caches permissions
- Avoid checking permissions in loops
- Use `PermissionGate` for conditional rendering instead of multiple `hasPermission` calls

### 5. Testing

```tsx
// Test with different roles
// 1. Create test users with specific roles
// 2. Verify UI elements show/hide correctly
// 3. Verify server-side protection works
// 4. Test edge cases (no roles, multiple roles, etc.)
```

## Common Patterns

### Pattern 1: Conditional Form Fields

```tsx
function ProjectForm() {
  const { hasPermission } = usePermissions()

  return (
    <form>
      <Input name="name" />
      <Input name="description" />
      
      {hasPermission('projects.manage_budget') && (
        <Input name="budget" type="number" />
      )}
    </form>
  )
}
```

### Pattern 2: Action Buttons

```tsx
function ProjectActions({ project }) {
  return (
    <div>
      <HasPermission permission="projects.update">
        <EditButton project={project} />
      </HasPermission>
      
      <HasPermission permission="projects.delete">
        <DeleteButton project={project} />
      </HasPermission>
    </div>
  )
}
```

### Pattern 3: Navigation Items

```tsx
function Sidebar() {
  const { hasPermission } = usePermissions()

  const navItems = [
    { title: "Dashboard", url: "/dashboard" },
    hasPermission('projects.read') && { title: "Projects", url: "/projects" },
    hasPermission('users.read') && { title: "Users", url: "/users" },
  ].filter(Boolean)

  return <Nav items={navItems} />
}
```

### Pattern 4: Protected API Route

```typescript
// app/api/projects/route.ts
import { requirePermission } from '@/lib/rbac-middleware'

export async function POST(request: Request) {
  const user = await requirePermission('projects.create')
  
  // Process request...
}
```

## Troubleshooting

### Users Can't See Anything

1. Check if user has any roles assigned
2. Verify roles have permissions assigned
3. Check if user record exists in public.users table
4. Verify auth.users trigger is working

### Permission Checks Not Working

1. Clear browser cache/cookies
2. Log out and log back in
3. Check browser console for errors
4. Verify Supabase connection is working

### Role Assignment Not Saving

1. Check if user_id and role_id are valid UUIDs
2. Verify no unique constraint violations
3. Check Supabase logs for errors

## Database Maintenance

### Seeding Permissions for New Module

```sql
INSERT INTO permissions (name, display_name, description, module, action) VALUES
    ('new_module.create', 'Create New Module', 'Can create new module items', 'new_module', 'create'),
    ('new_module.read', 'View New Module', 'Can view new module items', 'new_module', 'read'),
    ('new_module.update', 'Update New Module', 'Can update new module items', 'new_module', 'update'),
    ('new_module.delete', 'Delete New Module', 'Can delete new module items', 'new_module', 'delete');
```

### Assigning Permissions to Role

```sql
-- Get permission IDs
SELECT id, name FROM permissions WHERE module = 'new_module';

-- Assign to role
INSERT INTO role_permissions (role_id, permission_id) VALUES
    ('role-uuid-here', 'permission-uuid-here');
```

## API Reference

### Data Layer (`/src/data/rbac.ts`)

- `getAllPermissions()` - Get all permissions
- `getAllRoles(organisationId?)` - Get all roles
- `createRole(data)` - Create new role
- `updateRole(roleId, data)` - Update role
- `deleteRole(roleId)` - Delete role
- `assignRoleToUser(data)` - Assign role to user
- `removeRoleFromUser(userId, roleId)` - Remove role from user
- `getUserPermissions(userId)` - Get user's permissions
- `checkUserPermission(userId, permission)` - Check single permission

### Actions Layer (`/src/actions/rbac.ts`)

Server actions with the same names but suffixed with `Action`:
- `getAllRolesAction()`
- `createRoleAction()`
- etc.

### Hooks (`/src/hooks/usePermissions.ts`)

```typescript
const {
  permissions,      // Array of permission names
  roles,           // Array of role names
  loading,         // Loading state
  hasPermission,   // Check single permission
  hasRole,         // Check single role
  hasAnyPermission,// Check any of multiple permissions
  hasAllPermissions,// Check all permissions
  hasAnyRole,      // Check any of multiple roles
  isAdmin,         // Is admin or super admin
  isSuperAdmin,    // Is super admin
  refetch,         // Refetch permissions
} = usePermissions()
```

## Support

For issues or questions about RBAC:

1. Check this documentation
2. Review the code in `/src/lib/permissions.ts` and `/src/data/rbac.ts`
3. Check Supabase logs for database errors
4. Contact the development team

---

**Last Updated**: 2026-02-10
**Version**: 1.0.0
