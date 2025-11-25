-- Add status column to azami_relations table
ALTER TABLE azami_relations 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'suggested' 
CHECK (status IN ('suggested', 'accepted', 'rejected'));

-- Create index for status
CREATE INDEX IF NOT EXISTS idx_azami_relations_status ON azami_relations(status);

-- Comment
COMMENT ON COLUMN azami_relations.status IS 'Status of the relation: suggested (by AI), accepted (by user), rejected (by user)';
