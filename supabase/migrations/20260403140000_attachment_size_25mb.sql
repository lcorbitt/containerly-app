-- Align storage bucket + row check with app limit (25 MB per file).

update storage.buckets
set file_size_limit = 26214400
where id = 'tracking-request-files';

alter table public.tracking_request_attachments
  drop constraint if exists tracking_request_attachments_file_size_bytes_check;

alter table public.tracking_request_attachments
  add constraint tracking_request_attachments_file_size_bytes_check
  check (file_size_bytes >= 0 and file_size_bytes <= 26214400);
