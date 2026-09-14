/*
 * =============================================================================
 * 022_STORAGE_TENANT_ISOLATION
 *
 * STATUS: DEFERRED — requires storage path audit before implementation.
 *
 * Assessment finding (Sprint 5.1):
 *   The three storage buckets (rt-assets, payment-proof, expense-receipts)
 *   have open INSERT/UPDATE/DELETE policies for all authenticated users.
 *   Any authenticated user from any RT can upload, update, or delete objects
 *   in any RT's buckets, enabling cross-RT storage pollution.
 *
 * Proposed change (Sprint 5.1 Step 7):
 *   Scope upload/update/delete policies to RT membership using a path-based
 *   check that extracts the RT ID from the storage object path:
 *
 *     WITH CHECK (
 *         bucket_id = '<bucket>'
 *         AND is_member_of_rt((storage.foldername(name))[1]::uuid)
 *     )
 *
 *   This assumes objects are stored at: {rt_id}/{filename}
 *
 * Blocker:
 *   The storage path naming convention in the application has not been
 *   audited. If existing uploaded objects do not follow a consistent
 *   {rt_id}/... prefix structure, applying this policy would:
 *     a) Break reads/deletes for existing objects lacking the prefix
 *     b) Block uploads from the application if the upload path doesn't
 *        match the expected {rt_id}/{filename} format
 *
 * Required before implementation:
 *   1. Audit all storage upload paths in the application code
 *      (lib/repositories, API routes that call supabase.storage.upload)
 *   2. Confirm all three buckets use consistent {rt_id}/... prefix
 *   3. Migrate any existing objects that don't follow the convention
 *   4. Then apply this migration
 *
 * This migration is intentionally a no-op placeholder. Do not apply it
 * until the path audit is complete.
 *
 * Tracked as: Sprint 5.3 prerequisite
 *
 * Dependencies : 006_storage (bucket policies in 007_rls), 005_functions
 *   (is_member_of_rt)
 * =============================================================================
 */

-- No SQL changes in this migration.
-- Storage tenant isolation is deferred pending a storage path audit.
-- See the comment block above for implementation details and prerequisites.
