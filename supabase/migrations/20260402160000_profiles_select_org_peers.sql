-- Allow org members to read basic profile rows for teammates in the same organization
-- (needed for showing author names on shared resources like report_messages).

drop policy if exists "profiles_select_own_or_superadmin" on public.profiles;

create policy "profiles_select_visible"
  on public.profiles for select
  using (
    id = auth.uid()
    or public.is_superadmin()
    or exists (
      select 1
      from public.organization_members m_self
      inner join public.organization_members m_peer
        on m_peer.organization_id = m_self.organization_id
        and m_peer.user_id = profiles.id
      where m_self.user_id = auth.uid()
    )
  );
