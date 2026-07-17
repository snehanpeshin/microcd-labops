-- Server-only endpoints call this security-definer function through the
-- Supabase service role. Public clients remain unable to execute it.
grant execute on function public.consume_rate_limit(text,text,integer,integer) to service_role;
grant insert on table public.leads to service_role;
