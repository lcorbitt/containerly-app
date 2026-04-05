-- Allow the tracking request creator to add themselves as a participant without an
-- organization_members row (e.g. platform superadmin acting in org context via is_org_member bypass).
-- Previous policy required INNER JOIN organization_members on the participant user_id, which
-- failed for superadmins who are not listed in organization_members for the selected org.

drop policy if exists "tracking_request_participants_insert" on public.tracking_request_participants;

create policy "tracking_request_participants_insert"
  on public.tracking_request_participants for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.tracking_requests tr
      where tr.id = tracking_request_participants.tracking_request_id
        and public.is_org_member(tr.organization_id)
        and (
          exists (
            select 1
            from public.organization_members om
            where om.organization_id = tr.organization_id
              and om.user_id = tracking_request_participants.user_id
          )
          or (
            tr.created_by = auth.uid()
            and tracking_request_participants.user_id = auth.uid()
          )
        )
    )
  );
