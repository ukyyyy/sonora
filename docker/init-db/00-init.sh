#!/bin/bash
# Runs once when the postgres volume is empty. Applies every Supabase migration
# from ../supabase/migrations in filename order.
set -e
for f in /migrations/*.sql; do
  echo "==> Applying $f"
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$f"
done
