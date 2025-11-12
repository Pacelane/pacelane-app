-- Add foreign key constraint to generated_posts.whatsapp_input_id
-- This migration runs after whatsapp_input_test table is created

DO $$ 
BEGIN
    -- Check if the constraint doesn't already exist before adding it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'generated_posts_whatsapp_input_id_fkey'
        AND table_name = 'generated_posts'
    ) THEN
        ALTER TABLE public.generated_posts 
        ADD CONSTRAINT generated_posts_whatsapp_input_id_fkey 
        FOREIGN KEY (whatsapp_input_id) 
        REFERENCES public.whatsapp_input_test(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

