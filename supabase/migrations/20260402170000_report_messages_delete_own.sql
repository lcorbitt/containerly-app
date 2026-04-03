-- Authors may delete their own report messages (replies cascade via parent_message_id FK).

create policy "report_messages_delete_own"
  on public.report_messages for delete
  using (
    public.is_org_member(organization_id)
    and author_user_id is not null
    and author_user_id = auth.uid()
  );
