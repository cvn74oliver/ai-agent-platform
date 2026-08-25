drop policy if exists workspace_review_unit_projection_manifests_tenant_all
  on public.workspace_review_unit_projection_manifests;
create policy workspace_review_unit_projection_manifests_tenant_all
on public.workspace_review_unit_projection_manifests
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.tenant_id = workspace_review_unit_projection_manifests.tenant_id
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.tenant_id = workspace_review_unit_projection_manifests.tenant_id
  )
);

drop policy if exists workspace_review_unit_activity_buckets_tenant_all
  on public.workspace_review_unit_activity_buckets;
create policy workspace_review_unit_activity_buckets_tenant_all
on public.workspace_review_unit_activity_buckets
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.tenant_id = workspace_review_unit_activity_buckets.tenant_id
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.tenant_id = workspace_review_unit_activity_buckets.tenant_id
  )
);
