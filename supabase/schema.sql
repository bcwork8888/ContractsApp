-- SQL Schema for Supabase PostgreSQL Database

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    official_name TEXT NOT NULL,
    logo TEXT DEFAULT './logo.JPG',
    name_card TEXT DEFAULT '',
    tier TEXT DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fullname TEXT,
    company TEXT DEFAULT '',
    role TEXT DEFAULT 'crew',
    approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Projects (Folders) Table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
    name TEXT NOT NULL,
    working_address TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    customer_billing_address TEXT,
    customer_email TEXT,
    status TEXT DEFAULT 'Draft',
    crew TEXT,
    crews TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Contracts Table
CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    folder_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    customer TEXT,
    seller TEXT,
    price NUMERIC,
    date TEXT,
    template TEXT DEFAULT 'company_default',
    phone TEXT,
    email TEXT,
    signature TEXT,
    token TEXT,
    signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMP WITH TIME ZONE,
    company_official_name TEXT,
    company_logo TEXT,
    company_name_card TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    folder_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    date TEXT,
    price NUMERIC,
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Note Replies Table
CREATE TABLE IF NOT EXISTS note_replies (
    id TEXT PRIMARY KEY,
    note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    username TEXT,
    fullname TEXT,
    role TEXT,
    content TEXT NOT NULL,
    date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) policies (Optional/Permissive for Serverless API)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_replies ENABLE ROW LEVEL SECURITY;

-- Allow anon and service role full access (managed securely via Backend Service Role Key)
CREATE POLICY "Public Read Access" ON companies FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON users FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON projects FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON contracts FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON notes FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON note_replies FOR SELECT USING (true);
