-- Migration: Switch from Google Drive to Supabase Storage
-- Run this in: Supabase Dashboard → SQL Editor → New query → Paste → Run

-- Add new columns to resumes table
alter table public.resumes
  add column if not exists storage_path text,
  add column if not exists file_url text;

-- Add new column to optimized_resumes table
alter table public.optimized_resumes
  add column if not exists storage_path text;
