# Tip Tracker Pro - Supabase Setup Instructions

## 🚀 Quick Setup (5 minutes)

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up/Sign in with GitHub
4. Click "New Project"
5. Choose organization, enter project name: `tip-tracker-pro`
6. Generate a secure password, select region
7. Wait for project to be created (~2 minutes)

### 2. Get Your Credentials
1. In your Supabase dashboard, go to **Settings > API**
2. Copy your **Project URL** 
3. Copy your **anon public** key

### 3. Configure the App
1. Open `supabase-config.js`
2. Replace `YOUR_SUPABASE_URL` with your Project URL
3. Replace `YOUR_SUPABASE_ANON_KEY` with your anon key

Example:
```javascript
const SUPABASE_URL = 'https://abcdefgh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### 4. Create Database Table
1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste this SQL:

```sql
-- Create tip entries table
CREATE TABLE tip_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours_worked DECIMAL(4,2) DEFAULT 0,
    total_tips DECIMAL(10,2) NOT NULL,
    net_sales DECIMAL(10,2) NOT NULL,
    wine_sales DECIMAL(10,2) DEFAULT 0,
    num_hosts INTEGER DEFAULT 0,
    num_runners INTEGER DEFAULT 0,
    notes TEXT,
    breakdown JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tip_entries ENABLE ROW LEVEL SECURITY;

-- Create policies so users can only see their own data
CREATE POLICY "Users can view own entries" ON tip_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries" ON tip_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON tip_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries" ON tip_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX tip_entries_user_date_idx ON tip_entries(user_id, date DESC);
```

4. Click **RUN** to execute

### 5. Enable Email Authentication (Optional but Recommended)
1. Go to **Authentication > Settings**
2. Under "Auth Providers", make sure "Email" is enabled
3. Configure email templates if desired
4. For production, set up SMTP settings

### 6. Customize Email Templates (Optional)
1. Go to **Authentication > Email Templates**
2. Select **"Confirm signup"**
3. Update the subject line to: `Confirm Your Tip Tracker Pro Account`
4. Customize the email body to mention your app:
```html
<h2>Welcome to Tip Tracker Pro!</h2>
<p>Thanks for signing up! Follow this link to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your account</a></p>
<p>Start tracking your tips and analyzing your earnings today!</p>
```

## ✅ Test Your Setup

1. Open your `index.html` in a browser
2. Click "Create Account" 
3. Enter name, email, password
4. Check your email for verification (if email auth is configured)
5. Try calculating and saving a tip entry

## 🔒 Security Features Enabled

- **Row Level Security**: Users can only access their own data
- **Email Verification**: Optional email confirmation
- **Secure Authentication**: Passwords are hashed by Supabase
- **Real-time Sync**: Data syncs across devices instantly

## 🚀 Deploy Your App

Once setup is complete, you can deploy to:
- **Vercel**: Drag and drop your folder
- **Netlify**: Connect your GitHub repo
- **GitHub Pages**: Enable in repo settings
- **Any static hosting**: Just upload the files

## 🆘 Troubleshooting

**"Supabase not configured" error?**
- Make sure you replaced the placeholder values in `supabase-config.js`
- Check that both URL and key are copied correctly

**Can't sign up/login?**
- Verify the database table was created successfully
- Check browser console for error messages
- Ensure RLS policies were created

**Data not saving?**
- Check that you're logged in
- Verify the tip_entries table exists
- Look for console errors

Need help? Check the [Supabase Documentation](https://supabase.com/docs) or create an issue!