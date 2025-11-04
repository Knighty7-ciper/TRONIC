# TRONIC Database Setup - Step by Step Guide

## Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com) and log in
2. Select your TRONIC project
3. Navigate to **SQL Editor** from the left sidebar

## Step 2: Run the Complete Database Setup
1. **Clear any existing queries** in the SQL Editor
2. **Copy the entire content** from `COMPLETE_DATABASE_SETUP.sql` file (all 325 lines)
3. **Paste it** into the SQL Editor
4. **Click the "Run" button** (blue button at the bottom)

## Step 3: What You Should See After Successful Execution

### Success Indicators:
- **No Error Messages** - The query should complete without any red error text
- **Success Message** - You should see a green success notification
- **Tables Created** - The result will show:
  - Status: "TRONIC Database Setup Complete!"
  - Message: "All tables, functions, and policies created successfully."
  - Tables: "sessions, users, messages, command_logs, system_metrics, user_activity"
  - Functions: "log_user_activity, get_user_stats, get_system_overview"

### Expected Output Format:
```
| status                    | message                                      | tables                                                                   | functions                                              | setup_completed_at           |
|--------------------------|----------------------------------------------|-------------------------------------------------------------------------|-------------------------------------------------------|------------------------------|
| TRONIC Database Setup Complete! | All tables, functions, and policies created successfully. | sessions, users, messages, command_logs, system_metrics, user_activity | log_user_activity, get_user_stats, get_system_overview | 2025-11-03 19:17:17.123456  |
```

## Step 4: Verify Database Structure
After successful execution, check these sections in your Supabase Dashboard:

### A. Tables Section (Database → Tables)
You should see these 6 new tables:
- ✅ `sessions` - User session management
- ✅ `users` - Extended user profiles  
- ✅ `messages` - Chat messages and AI interactions
- ✅ `command_logs` - Executed command tracking
- ✅ `system_metrics` - Performance monitoring data
- ✅ `user_activity` - Comprehensive activity logging

### B. Functions Section (Database → Functions)
You should see these 3 new functions:
- ✅ `log_user_activity` - Activity logging
- ✅ `get_user_stats` - User statistics
- ✅ `get_system_overview` - System overview

### C. RLS Policies Verification
1. Go to Database → Tables → (select any table like `sessions`)
2. Click on "Policies" tab
3. You should see policies starting with "Service role can manage all..."

## Step 5: Test Backend Connection
After database setup is complete, test the backend:

```bash
cd /workspace/tronic
./start.sh
```

Expected results:
- ✅ Backend starts successfully on port 5500
- ✅ Health endpoint responds: `http://localhost:5500/api/health`
- ✅ No "relation does not exist" errors in logs

## Common Issues and Solutions

### Issue: "permission denied for table auth.users"
**Solution**: This is expected - we disable RLS temporarily on auth.users during setup, then re-enable it. The message is normal and doesn't prevent setup.

### Issue: "relation sessions does not exist" 
**Solution**: This means the SQL didn't run successfully. Re-run the complete SQL script.

### Issue: Green checkmark but no tables visible
**Solution**: Refresh the Supabase Dashboard or log out/in again. Sometimes the UI needs a refresh.

## Final Verification Checklist
- [ ] SQL Editor shows success message
- [ ] 6 tables visible in Database → Tables
- [ ] 3 functions visible in Database → Functions  
- [ ] RLS policies configured for all tables
- [ ] Backend starts without database errors
- [ ] Health endpoint responds successfully

Once all steps are complete, your TRONIC database will be fully configured and ready to support all platform features!