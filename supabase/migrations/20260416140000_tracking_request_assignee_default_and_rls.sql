-- Default assignee = creator when they have organization_members (set by create-tracking-request Edge).
-- Any org member may update the row. Assignee must be null or a user in organization_members for that org.

comment on column public.tracking_requests.assignee_user_id is
  'Primary operator for this request. Set to the initiator only if they are an organization member; otherwise null. Org members may reassign to another member or clear.';

drop policy if exists "tr_insert" on public.tracking_requests;
create policy "tr_insert"
  on public.tracking_requests for insert
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and (
      assignee_user_id is null
      or exists (
        select 1
        from public.organization_members om
        where om.organization_id = tracking_requests.organization_id
          and om.user_id = assignee_user_id
      )
    )
  );

drop policy if exists "tr_update" on public.tracking_requests;
create policy "tr_update"
  on public.tracking_requests for update
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and (
      assignee_user_id is null
      or exists (
        select 1
        from public.organization_members om
        where om.organization_id = tracking_requests.organization_id
          and om.user_id = assignee_user_id
      )
    )
  );
