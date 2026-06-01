#!/usr/bin/env bash
# Mirror Edge import targets into supabase/functions/ so the local Docker runtime
# (which only mounts that folder) can resolve @supabase-shared, @models, and @shared.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FUNCS="$ROOT/supabase/functions"

ditto "$ROOT/supabase/shared" "$FUNCS/supabase-shared"
ditto "$ROOT/supabase/models" "$FUNCS/edge-models"
ditto "$ROOT/shared" "$FUNCS/edge-shared"

echo "Synced edge function deps into supabase/functions/"
