-- Migração para corrigir a coluna requirements na tabela campaigns
-- Esta migração é necessária porque PostgreSQL não consegue fazer cast automático de text para text[]

-- Primeiro, verificar e dropar se existir com tipo text
DO $$ 
BEGIN
    -- Para campaigns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'requirements'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE campaigns DROP COLUMN requirements;
        ALTER TABLE campaigns ADD COLUMN requirements text[] NOT NULL DEFAULT '{}';
    END IF;
    
    -- Para campaign_templates  
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaign_templates' 
        AND column_name = 'requirements'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE campaign_templates DROP COLUMN requirements;
        ALTER TABLE campaign_templates ADD COLUMN requirements text[] NOT NULL DEFAULT '{}';
    END IF;
END $$;
