/*
  # Create user watchlist table

  1. New Tables
    - `user_watchlist`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `content_id` (text, TMDB content ID)
      - `content_type` (text, movie/tv/anime)
      - `title` (text, content title)
      - `poster_path` (text, poster image path)
      - `genres` (text array, content genres)
      - `added_at` (timestamp, when added to watchlist)

  2. Security
    - Enable RLS on `user_watchlist` table
    - Add policies for authenticated users to manage their own watchlist
*/

CREATE TABLE IF NOT EXISTS user_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_id text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('movie', 'tv', 'anime')),
  title text NOT NULL,
  poster_path text,
  genres text[] DEFAULT '{}',
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_id, content_type)
);

-- Add foreign key constraint
ALTER TABLE user_watchlist 
ADD CONSTRAINT user_watchlist_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own watchlist"
  ON user_watchlist
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist items"
  ON user_watchlist
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist items"
  ON user_watchlist
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_id ON user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_content ON user_watchlist(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_added_at ON user_watchlist(added_at DESC);