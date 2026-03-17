# 🧩 Schema Comparison & Safe Migration Checklist  
_Last updated: February 2026_

---

## 🎯 Purpose
This checklist ensures we **safely compare the live Supabase schema** against any new backend migration before executing SQL changes.

It prevents:
- ❌ Accidental table overwrites  
- ❌ Duplicate columns or indexes  
- ❌ Policy conflicts  
- ❌ Trigger/function duplication  
- ❌ Production data loss  

This process is **mandatory before running any migration in Supabase Studio**.

---

## 📦 Prerequisites

Before starting, confirm you have:

- ✅ A recent Supabase schema snapshot  
  Example:  
  ```
  /web/staging/supabase_schema_snapshot_YYYY-MM-DD.sql
  ```

- ✅ The new migration file  
  Example:  
  ```
  /web/staging/phase1_backend_drop/20251108_clarify_phase1.sql
  ```

- ✅ Terminal access
- ✅ Supabase Studio access
- ✅ Project reference ID for psql dry-runs
- ✅ Access to Supabase CLI (optional but recommended)
- ✅ Ability to run `pg_dump` or Supabase schema export

---

## 🪜 Step-by-Step Process

---

### 1️⃣ Confirm Files Exist

```bash
ls -lh web/staging/*schema_snapshot*.sql
ls -lh web/staging/**/*.sql
```

Confirm:
- Files exist
- File size > 0 bytes
- The snapshot date is current

If snapshot is outdated → regenerate before proceeding.

---

### 2️⃣ Open Both Files Side-by-Side

In VS Code:

1. Open the schema snapshot file.
2. Open the migration file.
3. Right-click one tab → **Select for Compare**
4. Right-click the other tab → **Compare with Selected**

Carefully review highlighted differences.

---

### 3️⃣ Focus on Critical Object Types

Pay special attention to these patterns:

| Object Type | What to Verify |
|-------------|---------------|
| `CREATE TABLE` | Table does NOT already exist in snapshot |
| `ALTER TABLE ADD COLUMN` | Column does NOT already exist |
| `CREATE INDEX` | Index name is not duplicated |
| `CREATE POLICY` | Policy name not duplicated for same role/action |
| `CREATE FUNCTION` | Function name + signature not duplicated |
| `CREATE TRIGGER` | Trigger not already attached |
| `DROP` statements | Ensure they are intentional and safe |

⚠️ Additional Supabase-specific checks:
- RLS policies must be reviewed for unintended overrides
- Auth schema tables (`auth.users`, etc.) must NEVER be modified
- Ensure no changes break existing foreign key relationships

---

### 4️⃣ Convert Unsafe Statements

If a statement already exists in live schema:

**Option A — Comment it out**
```sql
-- Table already exists in live schema
-- CREATE TABLE public.guided_setup_sessions ( ... );
```

**Option B — Convert to safe alter**
```sql
ALTER TABLE public.guided_setup_sessions
ADD COLUMN IF NOT EXISTS new_column text;
```

**Option C — Use idempotent patterns**
```sql
CREATE INDEX IF NOT EXISTS idx_example ON table_name(column_name);
```

```sql
CREATE OR REPLACE FUNCTION function_name(...) RETURNS ...
```

---

### 5️⃣ Save a Safe Migration Copy

Never modify the original migration.

Save a cleaned version as:

```
/web/staging/safe_migration_YYYY-MM-DD.sql
```

This is the only file allowed to be executed.

---

### 6️⃣ Perform a Local Dry Run (Highly Recommended)

Alternative (Supabase CLI):
```bash
supabase db reset
supabase db push
```

```bash
psql \
  -h db.<your_project_ref>.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f web/staging/safe_migration_YYYY-MM-DD.sql \
  --echo-all \
  --single-transaction \
  --set ON_ERROR_STOP=on
```

Replace `<your_project_ref>` with your Supabase project ID.

If:
- ✅ No errors → safe to proceed
- ❌ Errors → fix before production execution

---

### 7️⃣ Execute in Supabase Studio

1. Open **Supabase Studio → SQL Editor**
2. Paste contents of:
   ```
   safe_migration_YYYY-MM-DD.sql
   ```
3. Run once
4. Verify new tables/columns under:
   - Database → Tables
   - Database → Policies
   - Database → Functions

---

### 8️⃣ Post-Migration Validation

After execution:

- ✅ Confirm no duplicate policies
- ✅ Confirm RLS still works
- ✅ Confirm app loads successfully
- ✅ Confirm no 500 errors in API routes
- ✅ Confirm new columns appear in Supabase UI
- ✅ Verify no unexpected row deletions occurred
- ✅ Verify triggers/functions execute correctly
- ✅ Check Supabase logs for errors (Database → Logs)

---

### 9️⃣ Log the Migration

Append to `/web/docs/CHANGELOG.md`:

```md
### ✅ YYYY-MM-DD – Safe Migration Executed

Ran verified migration file `safe_migration_YYYY-MM-DD.sql` on Supabase.

- No conflicts detected
- Schema validated
- RLS policies confirmed
- Application tested successfully
```

Update `/web/docs/TODO.md` to mark migration comparison complete.

---

## 🧠 Operational Rules

- 🔒 Never run raw agent-generated SQL directly in production.
- 📸 Always snapshot before any schema change.
- 🗂 Keep all snapshots in `/web/staging/`.
- 🧪 Dry-run whenever possible.
- 🌲 Run:

```bash
bash web/automation/generate_project_tree.sh
```

after any structural change.

- 🧱 Always prefer additive changes over destructive ones
- 🔁 Ensure migrations are idempotent (safe to re-run)
- 🧾 Keep a rollback plan for every migration

---

## 🚦 Stop Conditions

Do NOT proceed if:

- Snapshot is outdated
- Migration file is unclear
- DROP statements affect unknown tables
- RLS policies are being replaced without review
- A previous migration failed

Escalate to Project Manager review before execution.

---

This checklist must be followed for:
- Phase migrations
- RAG schema updates
- Agent session analytics updates
- Fine-tuning schema changes
- Any new table or policy introduction

---

## 🔄 Rollback Strategy (Required)

Before executing any migration, define:

- How to revert schema changes
- Whether data loss is possible
- Backup location (snapshot or export)

Example rollback:
```sql
ALTER TABLE table_name DROP COLUMN IF EXISTS new_column;
```

```bash
pg_restore --clean --if-exists --dbname=postgres backup.dump
```

---

This checklist must be followed for:
- Phase migrations
- RAG schema updates
- Agent session analytics updates
- Fine-tuning schema changes
- Any new table or policy introduction