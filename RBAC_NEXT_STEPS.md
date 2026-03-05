# RBAC Implementation - Next Steps

## ✅ What's Been Completed

Your RBAC system is **fully implemented and ready to use**! Here's everything that was done:

### 1. Database Schema ✅
- Updated migration file with all RBAC tables
- Created auto-user creation trigger
- Seeded 7 default roles with permissions
- Added 52 permissions across 11 modules

### 2. Backend Code ✅
- Complete data layer for RBAC operations
- Server actions for all RBAC functions
- Permission checking utilities
- Route protection middleware

### 3. User Interface ✅
- Role management page at `/roles`
- User role assignment dialog
- All CRUD operations for roles
- Permission selection interface
- Roles column in users table

### 4. Developer Tools ✅
- `usePermissions()` hook
- `<PermissionGate>` component
- Type-safe permission checking
- Comprehensive documentation

## 🚀 Immediate Next Steps (Required)

### Step 1: Run Database Migration

You need to apply the database changes:

**Option A: Using Supabase CLI (Recommended)**
```bash
# If you have Supabase CLI installed
supabase db reset

# Or push specific migration
supabase db push
```

**Option B: Manually in Supabase Dashboard**
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Open the file: `supabase/migrations/tables.sql`
4. Execute the SQL (or copy the new sections)

**Important**: The migration file has been updated, not created new. You may need to:
- Either apply the full migration to a fresh database
- Or extract just the new RBAC sections (search for "RBAC" comments in the file)

### Step 2: Verify the Migration

Run this SQL to check if tables were created:

```sql
-- Check if RBAC tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('permissions', 'role_permissions', 'user_roles');

-- Check if roles were seeded
SELECT id, name, display_name FROM roles WHERE is_system_role = true;

-- Check if permissions were seeded
SELECT COUNT(*) as permission_count FROM permissions;
-- Should return 52

-- Check if trigger exists
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### Step 3: Create Your First Test User

1. Sign up a new user in your app
2. Check if they appear in the `users` table (auto-created by trigger)
3. Assign them a role:
   - Go to `/users` page
   - Click ⋮ menu → "Manage Roles"
   - Assign "Admin" or "Super Admin" role

### Step 4: Test the System

1. **Test Role Management**:
   - Go to `/roles` page
   - View existing roles
   - Try creating a custom role
   - Edit permissions on a custom role

2. **Test User Role Assignment**:
   - Go to `/users` page
   - Assign roles to users
   - Verify roles appear in the roles column

3. **Test Permissions**:
   - Log in with different users
   - Verify they see different UI elements
   - Try accessing protected pages

## 📋 Optional Next Steps (Recommended)

### Step 1: Protect Existing Pages

Add permission checks to your existing pages. Here are the priority pages:

**High Priority:**
```tsx
// app/(authenticated)/projects/create/page.tsx
import { requirePermission } from '@/lib/rbac-middleware'
export default async function CreateProjectPage() {
    await requirePermission('projects.create')
    // ... rest of page
}

// app/(authenticated)/organisations/page.tsx
import { requireAdmin } from '@/lib/rbac-middleware'
export default async function OrganisationsPage() {
    await requireAdmin()
    // ... rest of page
}

// app/(authenticated)/users/page.tsx
import { requirePermission } from '@/lib/rbac-middleware'
export default async function UsersPage() {
    await requirePermission('users.read')
    // ... rest of page
}
```

**See `RBAC_EXAMPLES.md` for more examples!**

### Step 2: Protect Server Actions

Add permission checks to server actions in:
- `src/actions/projects.ts`
- `src/actions/user-management.ts`
- `src/actions/documents.ts`
- etc.

Example:
```tsx
import { requirePermission } from '@/lib/rbac-middleware'

export async function createProjectAction(data: ProjectInput) {
    await requirePermission('projects.create')
    // ... rest of action
}
```

### Step 3: Update Navigation

Make navigation conditional based on permissions.

See `RBAC_EXAMPLES.md` → Example 7 for details.

### Step 4: Add Conditional UI Elements

Use `<HasPermission>` or `usePermissions()` to show/hide buttons and actions.

See `RBAC_EXAMPLES.md` for various patterns.

## 📖 Documentation Reference

| Document | Purpose | Location |
|----------|---------|----------|
| **Main Implementation Summary** | Overview of everything | `RBAC_IMPLEMENTATION.md` |
| **Complete Guide** | Comprehensive documentation | `docs/RBAC_GUIDE.md` |
| **Quick Reference** | Fast lookup | `docs/RBAC_QUICK_REFERENCE.md` |
| **Code Examples** | Real-world usage examples | `RBAC_EXAMPLES.md` |
| **Next Steps** | This file | `RBAC_NEXT_STEPS.md` |

## 🎯 Quick Start Guide

### For Users/Admins

1. **Access RBAC Management**:
   - Click "User Management" in sidebar
   - Select "Role Based Permissions"

2. **Assign Roles**:
   - Go to "Users" page
   - Click ⋮ on any user
   - Select "Manage Roles"

### For Developers

1. **Check Permission in Component**:
```tsx
import { HasPermission } from '@/components/shared/permission-gate'

<HasPermission permission="projects.create">
    <CreateButton />
</HasPermission>
```

2. **Protect Page**:
```tsx
import { requirePermission } from '@/lib/rbac-middleware'

export default async function Page() {
    await requirePermission('projects.read')
    return <Content />
}
```

3. **Use Hook**:
```tsx
import { usePermissions } from '@/hooks/usePermissions'

const { hasPermission } = usePermissions()
if (hasPermission('projects.create')) {
    // show button
}
```

## ⚠️ Important Notes

### 1. System Roles
- System roles (Super Admin, Admin, PM, etc.) **cannot be deleted**
- They can be edited to modify permissions
- They are available globally (not tied to organisations)

### 2. Custom Roles
- Custom roles are tied to specific organisations
- Admins can create custom roles for their organisation
- Custom roles won't appear in other organisations

### 3. Default Behavior
- New users start with **NO roles** (NULL)
- Admins must manually assign roles
- Users without roles will see an empty dashboard

### 4. Internal Users
- Users with `is_internal = true` in their organisation are Mechlin members
- This field is not yet being used but is available for future logic

## 🐛 Troubleshooting

### Issue: Tables not created
**Solution**: Run the migration SQL in Supabase dashboard

### Issue: Trigger not working (users not auto-created)
**Solution**: 
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Manually run the trigger function creation from tables.sql
```

### Issue: No roles showing up
**Solution**: 
```sql
-- Verify roles were seeded
SELECT * FROM roles WHERE is_system_role = true;

-- If empty, run the seed data section from tables.sql
```

### Issue: Permissions not working
**Solution**:
1. Log out and log back in
2. Clear browser cache
3. Check if user has roles assigned
4. Verify roles have permissions

### Issue: Can't access /roles page
**Solution**: Ensure your user has `roles.read` permission (assign Super Admin or Admin role)

## 🎨 Customization Ideas

### Add More Permissions
```sql
INSERT INTO permissions (name, display_name, description, module, action) VALUES
    ('custom.action', 'Custom Action', 'Description', 'custom', 'action');

-- Assign to role
INSERT INTO role_permissions (role_id, permission_id)
VALUES ('role-id', 'permission-id');
```

### Create Organisation-Specific Role
Use the UI at `/roles` or:
```sql
INSERT INTO roles (organisation_id, name, display_name, description)
VALUES ('org-uuid', 'custom_role', 'Custom Role', 'For special users');
```

### Add Field-Level Permissions
You can add special permissions like:
- `projects.view_budget`
- `projects.edit_sensitive_data`
- `users.view_salary`

Then check them in your forms:
```tsx
{hasPermission('projects.view_budget') && (
    <div>Budget: {project.budget}</div>
)}
```

## ✅ Success Checklist

- [ ] Database migration applied
- [ ] Roles visible at `/roles` page
- [ ] Test user created and assigned role
- [ ] User can see role-appropriate UI elements
- [ ] Protected pages redirect unauthorized users
- [ ] No console errors related to RBAC
- [ ] Documentation reviewed

## 🆘 Need Help?

1. **Check the documentation**:
   - `RBAC_GUIDE.md` for detailed info
   - `RBAC_EXAMPLES.md` for code samples

2. **Review the code**:
   - `/src/lib/permissions.ts` - Core utilities
   - `/src/data/rbac.ts` - Data operations

3. **Check database**:
   - View tables in Supabase dashboard
   - Run test queries

4. **Debug**:
   - Check browser console for errors
   - Check Supabase logs
   - Use `console.log()` in `usePermissions` hook

## 🎉 You're All Set!

Your RBAC system is ready to use. Just:
1. Run the migration
2. Create test users
3. Assign roles
4. Start protecting your pages

**Remember**: See `RBAC_EXAMPLES.md` for copy-paste ready code examples!

---

**Implementation Complete**: ✅  
**Date**: February 10, 2026  
**Next Step**: Apply database migration
