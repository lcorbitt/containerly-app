-- Distinguish operator vs customer uploads; shipment documents are customer-visible.

do $$ begin
  create type public.attachment_uploader_kind as enum ('operator', 'customer');
exception
  when duplicate_object then null;
end $$;

alter table public.workspace_attachments
  add column if not exists uploaded_by_kind public.attachment_uploader_kind;

comment on column public.workspace_attachments.uploaded_by_kind is
  'Who uploaded the file: operator (org member) or customer (importer grant).';

-- Shipment-level documents: visible on customer portal; infer uploader role.
update public.workspace_attachments wa
set
  is_internal = false,
  uploaded_by_kind = case
    when exists (
      select 1
      from public.shipments s
      inner join public.organization_members om
        on om.organization_id = s.organization_id
        and om.user_id = wa.uploaded_by
      where s.id = wa.shipment_id
    ) then 'operator'::public.attachment_uploader_kind
    when exists (
      select 1
      from public.shipment_customer_access sca
      where sca.shipment_id = wa.shipment_id
        and sca.customer_user_id = wa.uploaded_by
        and sca.revoked_at is null
    ) then 'customer'::public.attachment_uploader_kind
    else 'operator'::public.attachment_uploader_kind
  end
where wa.shipment_id is not null
  and wa.container_id is null;

-- Container-scoped attachments: keep visibility; set uploader kind when missing.
update public.workspace_attachments wa
set uploaded_by_kind = case
  when wa.is_internal then 'operator'::public.attachment_uploader_kind
  when exists (
    select 1
    from public.containers c
    inner join public.organization_members om
      on om.organization_id = c.organization_id
      and om.user_id = wa.uploaded_by
    where c.id = wa.container_id
  ) then 'operator'::public.attachment_uploader_kind
  else 'customer'::public.attachment_uploader_kind
end
where wa.container_id is not null
  and wa.uploaded_by_kind is null;

create index if not exists idx_workspace_attachments_shipment_uploader_kind
  on public.workspace_attachments (shipment_id, uploaded_by_kind)
  where shipment_id is not null;
