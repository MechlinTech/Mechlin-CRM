# Quick Start: User Invitation System

## 🚀 Immediate Setup (3 Steps)

### 1️⃣ Get Service Role Key
```bash
# Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
# Copy the "service_role" key (not anon key!)
```

Add to `.env`:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_actual_key_here
```

### 2️⃣ Run Migration
Copy contents of `supabase/migrations/user_invites.sql` and run in Supabase SQL Editor:
https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

### 3️⃣ Restart Server
```bash
npm run dev
```

## ✅ You're Done!

### Test It:
1. Go to `/users` page
2. Click **"Add User"** button
3. Select **"Send Invitation"** tab
4. Enter email and organisation
5. Click **"Send Invitation"**

### View Invites:
- Navigate to `/invites` to see all pending invitations

---

## 🎯 What You Got

✅ **Email Invitations** - Users receive secure signup links  
✅ **Tracking Table** - `user_invites` tracks all invitations  
✅ **Two-Tab UI** - Invite via email OR create directly  
✅ **Invites Page** - View all pending/accepted/expired invites  
✅ **Auto-Expiry** - Invites expire after 7 days  
✅ **Security** - RLS policies + service role protection  

---

## 📚 Full Documentation
See `docs/USER_INVITATION_SYSTEM.md` for complete details.
