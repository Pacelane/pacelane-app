-- Add reactions_data column to leads table
-- This will store the raw reactions array from the Apify LinkedIn Profile Reactions actor

ALTER TABLE leads ADD COLUMN IF NOT EXISTS reactions_data jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_leads_reactions_data ON leads USING GIN (reactions_data);

-- Add comment to document the column
COMMENT ON COLUMN leads.reactions_data IS 'Raw reactions data from Apify LinkedIn Profile Reactions actor (VMwB47uSx3g2wCcBK). Contains array of reaction objects with id, action, actor, post details.';
