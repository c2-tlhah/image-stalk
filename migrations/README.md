# Database Setup

This project uses Cloudflare D1 (SQLite) for data storage.

## Initial Setup

1. **Create the D1 database:**
   ```powershell
   wrangler d1 create profile-image-intel
   ```

2. **Copy the database ID:**
   After creation, Wrangler will output a database ID. Copy it and update `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "profile-image-intel"
   database_id = "YOUR_DATABASE_ID_HERE"  # Replace this
   ```

3. **Run migrations:**
   ```powershell
   wrangler d1 execute profile-image-intel --remote --file=./migrations/0001_initial_schema.sql
   ```

## Local Development

For local development, you can use a local D1 database:

```powershell
# Create local database
wrangler d1 execute profile-image-intel --local --file=./migrations/0001_initial_schema.sql

# Query local database
wrangler d1 execute profile-image-intel --local --command="SELECT * FROM reports LIMIT 10"
```

## Database Schema

### Tables

#### `users`
- `id` (TEXT, PK): User ID
- `created_at` (INTEGER): Unix timestamp

#### `reports`
- `id` (TEXT, PK): Report ID
- `user_id` (TEXT, FK): User ID (nullable)
- `input_type` (TEXT): 'url' or 'upload'
- `source_url` (TEXT): Original URL (nullable)
- `final_url` (TEXT): Final URL after redirects (nullable)
- `created_at` (INTEGER): Unix timestamp
- `sha256` (TEXT): Content hash
- `phash` (TEXT): Perceptual hash
- `results_json` (TEXT): Full analysis result as JSON

#### `events`
- `id` (TEXT, PK): Event ID
- `report_id` (TEXT, FK): Report ID
- `checked_at` (INTEGER): Unix timestamp
- `headers_json` (TEXT): HTTP headers as JSON
- `sha256` (TEXT): Content hash at this check
- `change_type` (TEXT): 'initial', 'unchanged', 'content_changed', 'headers_changed'

## Querying Data

Example queries:

```sql
-- Get all reports
SELECT id, input_type, source_url, created_at FROM reports ORDER BY created_at DESC LIMIT 10;

-- Find reports by hash
SELECT * FROM reports WHERE sha256 = 'hash_value_here';

-- Get events for a report
SELECT * FROM events WHERE report_id = 'report_id_here' ORDER BY checked_at DESC;

-- Get statistics
SELECT 
  (SELECT COUNT(*) FROM reports) as total_reports,
  (SELECT COUNT(*) FROM events) as total_events,
  (SELECT COUNT(*) FROM reports WHERE input_type = 'url') as url_reports,
  (SELECT COUNT(*) FROM reports WHERE input_type = 'upload') as upload_reports;
```

## Migrations

Migrations are stored in the `migrations/` directory and should be run in order.

To create a new migration:
1. Create a new file: `migrations/XXXX_description.sql`
2. Write your SQL DDL statements
3. Run: `wrangler d1 execute profile-image-intel --remote --file=./migrations/XXXX_description.sql`
