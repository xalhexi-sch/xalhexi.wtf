-- Create community_messages table for the community chat feature
CREATE TABLE IF NOT EXISTS community_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel TEXT NOT NULL DEFAULT 'public',
  sender_name TEXT NOT NULL,
  sender_role TEXT DEFAULT 'user',
  message TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_messages_channel 
  ON community_messages(channel, created_at DESC);
