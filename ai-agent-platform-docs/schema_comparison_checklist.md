# 🧩 Schema Comparison & Safe Migration Checklist  
_Last updated: November 2025_

---

## 🎯 Purpose
To safely compare the **live Supabase schema** with any **new backend migration** before executing SQL changes.  
This checklist prevents accidental overwrites, duplicated tables, or lost data.

---

## 📦 Prerequisites
- A recent Supabase schema snapshot (e.g. `/web/staging/supabase_schema_snapshot_YYYY-MM-DD.sql`)
- The new migration file (e.g. `/web/staging/phase1_backend_drop/20251108_clarify_phase1.sql`)
- Terminal access and Supabase Studio connection

---

## 🪜 Step-by-Step Process

### 1️⃣ Confirm Files Exist
```bash
ls -lh web/staging/*schema_snapshot*.sql
ls -lh web/staging/phase1_backend_drop/*.sql

Ensure both snapshot and migration files are present and >0 bytes.

⸻

2️⃣ Open Both Files Side-by-Side

In VS Code:
	1.	Open both .sql files.
	2.	Right-click one tab → Select for Compare.
	3.	Right-click the other tab → Compare with Selected.

You’ll see differences highlighted line by line.

⸻

3️⃣ Focus on Key Objects

Look for these in the diff view:

| Object Type | What to Check |
|--------------|---------------|
| **CREATE TABLE** | Does the table already exist in the snapshot? If yes → skip creation or change to `ALTER TABLE`. |
| **ALTER TABLE** | Make sure the referenced column doesn’t already exist. |
| **CREATE INDEX** | Verify the index name isn’t duplicated. |
| **CREATE POLICY** | Ensure policy names aren’t duplicated for the same table. |
| **CREATE FUNCTION / TRIGGER** | Confirm the function or trigger doesn’t already exist. |

4️⃣ Mark Safe & Duplicate Lines

In the migration file, comment out duplicates:
-- Table already exists in live schema
-- CREATE TABLE public.guided_setup_sessions ( ... );
Save this edited version as:
web/staging/safe_migration_YYYY-MM-DD.sql

5️⃣ Validate Syntax Locally

Run a quick dry-run check:
psql -h db.<your_project_ref>.supabase.co -p 5432 -U postgres -d postgres -f web/staging/safe_migration_YYYY-MM-DD.sql --echo-all --single-transaction --set ON_ERROR_STOP=on
(Replace <your_project_ref> with your Supabase project ID.)

If it completes without error → the file is safe to run.

⸻

6️⃣ Execute in Supabase
	1.	Open Supabase Studio → SQL Editor.
	2.	Paste the contents of safe_migration_YYYY-MM-DD.sql.
	3.	Run it once.
	4.	Confirm new tables or columns appear under Database → Tables.

⸻

7️⃣ Log the Result

Append to /web/docs/CHANGELOG.md:
### ✅ <Date> – Safe Migration Executed
Ran verified migration file `safe_migration_<date>.sql` on Supabase.
No conflicts detected. Schema updated successfully.
Update /web/docs/TODO.md to mark the comparison as complete.

⸻

🧠 Notes
	•	Always snapshot before applying a migration.
	•	Never execute raw migration SQL from an agent until it’s verified.
	•	Keep all snapshots in /web/staging/ for traceability.
	•	Run bash web/automation/generate_project_tree.sh after every schema change.