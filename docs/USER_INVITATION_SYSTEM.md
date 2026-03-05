# User Invitation System - Setup Guide

## Overview
A complete user invitation system that allows admins to invite users via email. The system tracks invitations in a separate table before users are authenticated.

## What Was Created

### 1. Server-Side Admin Client
**File:** `src/lib/supabase-admin.ts`
- Uses Supabase service role key for admin operations
- Can bypass Row Level Security (RLS)
- Used for sending email invitations

### 2. Database Migration
**File:** `supabase/migrations/user_invites.sql`
- Creates `user_invites` table to track all invitations
- Includes RLS policies for security
- Tracks invitation status: pending, accepted, expired
- Automatically expires invitations after 7 days

### 3. API Endpoint
**File:** `src/app/api/users/invite/route.ts`
- **POST** `/api/users/invite` - Send invitation email
- **GET** `/api/users/invite` - Fetch all invitations
- Validates user doesn't already exist
- Prevents duplicate invitations
- Stores invitation record in database

### 4. UI Components

#### Invite Form
**File:** `src/components/custom/users/invite-user-form.tsx`
- Form to send invitation emails
- Organisation selector
- Email validation

#### Updated Add User Button
**File:** `src/components/custom/users/add-user-button.tsx`
- Now has 2 tabs:
  - **Send Invitation** (recommended) - Sends email invite
  - **Create Directly** - Creates user without auth

#### Invites Table
**File:** `src/components/custom/invites/invites-table.tsx`
- Displays all pending/accepted/expired invitations
- Shows who invited each user
- Shows expiration dates

#### Invites Page
**File:** `src/app/(authenticated)/(users-management)/invites/page.tsx`
- Dedicated page to view all invitations
- Access at `/invites`

### 5. UI Components Added
**File:** `src/components/ui/tabs.tsx`
- Radix UI tabs component for the tabbed interface

## Setup Steps

### Step 1: Get Your Service Role Key
1. Go to your Supabase Dashboard
2. Navigate to: **Project Settings** → **API**
3. Copy the **service_role** key (NOT the anon key)
4. Add it to your `.env` file:

```env
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

⚠️ **IMPORTANT:** Never commit this key to Git! It has full access to your database.

### Step 2: Run the Migration
You need to run the migration to create the `user_invites` table.

**Option A: Using Supabase CLI** (if installed)
```bash
supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to **SQL Editor** in your Supabase Dashboard
2. Copy the contents of `supabase/migrations/user_invites.sql`
3. Paste and run it

### Step 3: Configure Email Settings in Supabase
1. Go to **Authentication** → **Email Templates** in Supabase Dashboard
2. Customize the "Invite user" email template (optional)
3. Ensure your email provider is configured (Supabase provides default email service)

### Step 4: Set Redirect URL (Optional)
If you want to customize where users land after accepting the invite, update the redirect URL in:
`src/app/api/users/invite/route.ts` (line 65)

Currently set to: `http://localhost:3000/auth/callback`

### Step 5: Restart Your Dev Server
```bash
npm run dev
```

## How to Use

### Invite a User
1. Navigate to **Users** page
2. Click **"Add User"** button
3. Select **"Send Invitation"** tab
4. Enter email and select organisation
5. Click **"Send Invitation"**

The user will receive an email with a secure link to set up their account.

### View Invitations
Navigate to `/invites` to see:
- All pending invitations
- Who sent each invitation
- When invitations expire
- Accepted/expired status

## Database Schema

### user_invites Table
```sql
- id (UUID, Primary Key)
- email (VARCHAR, Unique)
- organisation_id (UUID, FK → organisations)
- invited_by (UUID, FK → auth.users)
- status ('pending' | 'accepted' | 'expired')
- invited_at (Timestamp)
- accepted_at (Timestamp, nullable)
- expires_at (Timestamp, default: 7 days)
- metadata (JSONB, for future use)
```

## Security Features

1. **RLS Policies**: Only users with `manage_users` permission can send invites
2. **Duplicate Prevention**: Checks if user already exists or has pending invite
3. **Expiration**: Invites expire after 7 days
4. **Service Role Key**: Kept secret, never exposed to client

## API Usage

### Send Invitation
```typescript
POST /api/users/invite
Content-Type: application/json

{
  "email": "user@example.com",
  "organisationId": "uuid-here"
}
```

### Get All Invitations
```typescript
GET /api/users/invite
```

## Next Steps

1. **Add Resend Functionality**: Allow admins to resend expired invitations
2. **Bulk Invites**: Upload CSV to invite multiple users
3. **Custom Email Templates**: Personalize invitation emails
4. **Invitation Analytics**: Track acceptance rates
5. **Revoke Invitations**: Allow canceling pending invites

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`
- Restart your dev server after adding it

### Email Not Sending
- Check Supabase email settings in Dashboard
- Verify you're using a valid email address
- Check Supabase logs for errors

### "Permission Denied"
- Ensure the logged-in user has `manage_users` permission
- Check RLS policies in Supabase

### Migration Errors
- Ensure `organisations` and `auth.users` tables exist
- Run migrations in order (tables.sql → rbac_safe.sql → user_invites.sql)

## Files Modified

- ✅ `src/lib/supabase.ts` - Changed to use `createBrowserClient` for cookie-based auth
- ✅ `src/components/custom/users/add-user-button.tsx` - Added tabs for invite/create
- ✅ `.env` - Added `SUPABASE_SERVICE_ROLE_KEY` placeholder

## Files Created

- ✅ `src/lib/supabase-admin.ts`
- ✅ `supabase/migrations/user_invites.sql`
- ✅ `src/app/api/users/invite/route.ts`
- ✅ `src/components/custom/users/invite-user-form.tsx`
- ✅ `src/components/custom/invites/invites-table.tsx`
- ✅ `src/app/(authenticated)/(users-management)/invites/page.tsx`
- ✅ `src/components/ui/tabs.tsx`
