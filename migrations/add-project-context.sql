-- Migration: Add projectContext column to Diagram table
-- Date: 2025-10-30

-- Add the projectContext column to existing Diagram table
ALTER TABLE Diagram ADD COLUMN projectContext TEXT;

-- Verify the change
-- SELECT sql FROM sqlite_master WHERE type='table' AND name='Diagram';
