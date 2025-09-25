// Supabase Configuration
// Replace these with your actual Supabase project credentials

const SUPABASE_URL = 'https://zbktypbjdplooyysnapr.supabase.co'; // Replace with your project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpia3R5cGJqZHBsb295eXNuYXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0ODY0MjIsImV4cCI6MjA3NDA2MjQyMn0.NHhcN6vb2ax98jYi5h3Yy1-Q5ew6d6aGUyX_SoI1xf0'; // Replace with your anon key

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database table schemas for reference:

/*
-- Users table (handled by Supabase Auth automatically)

-- Tip entries table
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

-- Row Level Security
ALTER TABLE tip_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own entries
CREATE POLICY "Users can view own entries" ON tip_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries" ON tip_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON tip_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries" ON tip_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Index for better performance
CREATE INDEX tip_entries_user_date_idx ON tip_entries(user_id, date DESC);
*/

// Setup Instructions:
/*
1. Go to https://supabase.com and create a new project
2. Copy your project URL and anon key from Settings > API
3. Replace SUPABASE_URL and SUPABASE_ANON_KEY above
4. Go to SQL Editor in Supabase dashboard
5. Run the SQL commands above to create the tip_entries table
6. The authentication tables are created automatically by Supabase
*/