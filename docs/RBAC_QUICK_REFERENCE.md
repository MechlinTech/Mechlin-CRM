# RBAC Quick Reference

## Common Permission Checks

### Client Components

```tsx
import { usePermissions } from '@/hooks/usePermissions'
import { HasPermission, AdminOnly } from '@/components/shared/permission-gate'

// Using Hook
const { hasPermission, isAdmin } = usePermissions()
if (hasPermission('projects.create')) { /* ... */ }

// Using Component
<HasPermission permission="projects.create">
  <Button>Create Project</Button>
</HasPermission>

// Admin Only
<AdminOnly>
  <AdminPanel />
</AdminOnly>
```

### Server Components & Pages

```tsx
import { requirePermission, requireAdmin } from '@/lib/rbac-middleware'

// Protect entire page
await requirePermission('projects.create')

// Admin only page
await requireAdmin()

// Check without redirect
const canEdit = await checkPermission('projects.update')
```

### Server Actions

```tsx
'use server'
import { requirePermission } from '@/lib/rbac-middleware'

export async function createProject(data) {
  await requirePermission('projects.create')
  // ... create project
}
```

## Common Permission Names

### Projects
- `projects.create`
- `projects.read`
- `projects.update`
- `projects.delete`
- `projects.manage_members`

### Users
- `users.create`
- `users.read`
- `users.update`
- `users.delete`
- `users.assign_roles`

### Documents
- `documents.create`
- `documents.read`
- `documents.update`
- `documents.delete`

### Roles
- `roles.create`
- `roles.read`
- `roles.update`
- `roles.delete`

## Common Roles

- `super_admin` - Full access
- `admin` - Organisation admin
- `pm` - Project manager
- `dev` - Developer
- `qa` - QA engineer
- `bd` - Business development
- `finance` - Finance team

## UI Management

### Assign Roles to User
1. Go to **User Management → Users**
2. Click actions menu (⋮) on user
3. Select "Manage Roles"
4. Select roles and save

### Create Custom Role
1. Go to **User Management → Role Based Permissions**
2. Click "Create Role"
3. Fill in details and select permissions
4. Click "Create Role"

### Edit Role Permissions
1. Go to **User Management → Role Based Permissions**
2. Click actions menu (⋮) on role
3. Select "Edit"
4. Update permissions and save

## Database Queries

```typescript
import { getUserPermissions, checkUserPermission } from '@/data/rbac'

// Get all permissions
const { data } = await getUserPermissions(userId)

// Check permission
const { hasPermission } = await checkUserPermission(userId, 'projects.create')
```

## TypeScript Types

```typescript
import type { 
  Permission, 
  Role, 
  PermissionName,
  CreateRoleInput,
  UpdateRoleInput 
} from '@/types/rbac'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| User can't see anything | Check if roles are assigned to user |
| Permissions not working | Log out and log back in |
| Can't create custom role | Check if user has `roles.create` permission |
| Role assignment fails | Verify user and role IDs are valid |

## Need More Help?

See full documentation: `/docs/RBAC_GUIDE.md`
