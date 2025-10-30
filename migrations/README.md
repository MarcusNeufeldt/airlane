# Database Migrations

This directory contains database migration scripts for the Airlane BPMN application.

## Current Migration: Add Project Context Column

**Migration File:** `add-project-context.sql`
**Date:** 2025-10-30
**Purpose:** Adds the `projectContext` column to the `Diagram` table to support storing project-specific context information.

## Running the Migration

### Option 1: Using the Migration Script (Recommended)

The easiest way to run the migration is using the automated migration script:

```bash
# From the project root
cd api
npm run migrate
```

This requires the following environment variables to be set:
- `TURSO_DATABASE_URL` or `DATABASE_URL` - Your Turso database URL
- `TURSO_AUTH_TOKEN` - Your Turso authentication token

### Option 2: Using Vercel CLI

If your database is deployed on Vercel, you can run the migration using the Vercel CLI:

```bash
# Pull environment variables from Vercel
vercel env pull .env.local

# Run the migration with the pulled environment
cd api
npm run migrate
```

### Option 3: Using Turso CLI Directly

If you have the Turso CLI installed and configured:

```bash
# List your databases
turso db list

# Connect to your database
turso db shell <your-database-name>

# Run the migration SQL
ALTER TABLE Diagram ADD COLUMN projectContext TEXT;

# Verify
SELECT sql FROM sqlite_master WHERE type='table' AND name='Diagram';
```

### Option 4: Manual SQL Execution

If you have direct access to your database, you can run the SQL directly:

```sql
ALTER TABLE Diagram ADD COLUMN projectContext TEXT;
```

## Verification

After running the migration, verify it was successful:

```bash
# The migration script includes automatic verification
# Or manually verify by querying:
SELECT projectContext FROM Diagram LIMIT 1;
```

If the query runs without error, the migration was successful!

## Rollback

If you need to rollback this migration:

```sql
-- Warning: This will delete all project context data
ALTER TABLE Diagram DROP COLUMN projectContext;
```

## Troubleshooting

### Error: "no such table: Diagram"
- The database hasn't been initialized. Run the initial setup first using `init-db.sql`

### Error: "duplicate column name: projectContext"
- The migration has already been run. No action needed.

### Error: "Database not configured"
- Make sure environment variables are set correctly
- Check that `TURSO_DATABASE_URL` or `DATABASE_URL` is accessible
- Verify `TURSO_AUTH_TOKEN` is provided

## Migration History

| Date | Migration | Description |
|------|-----------|-------------|
| 2025-10-30 | add-project-context.sql | Added projectContext column to Diagram table |
