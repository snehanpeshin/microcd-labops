update storage.buckets
set allowed_mime_types = array_append(allowed_mime_types, 'application/json')
where id = 'labops-files'
  and allowed_mime_types is not null
  and not ('application/json' = any(allowed_mime_types));
