-- ============================================================
-- GymovaFlow – Trainer public view + avatar storage
-- Created: 2026-03-28
-- ============================================================

ALTER TABLE IF EXISTS public.trainers RENAME TO trainer_records;

CREATE OR REPLACE VIEW public.trainers AS
SELECT
  tr.id,
  tr.user_id,
  tr.name,
  tr.specialty,
  tr.rating,
  tr.reviews,
  tr.price,
  COALESCE(gl.address, tr.location) AS location,
  ''::text AS distance,
  tr.specializations,
  tr.bio,
  tr.experience,
  tr.certifications,
  tr.clients_helped,
  tr.availability,
  tr.reviews_list
FROM public.trainer_records tr
JOIN public.profiles p ON p.id = tr.user_id
LEFT JOIN public.trainer_locations tl ON tl.trainer_id = tr.id AND tl.is_primary = true
LEFT JOIN public.gym_locations gl ON gl.id = tl.gym_location_id
WHERE p.role = 'trainer' AND p.trainer_status = 'approved';

CREATE OR REPLACE FUNCTION public.trainers_view_security_barrier()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'trainers is a read-only view; write to trainer_records instead';
END;
$$;

DROP TRIGGER IF EXISTS trainers_view_read_only ON public.trainers;
CREATE TRIGGER trainers_view_read_only
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.trainers
FOR EACH ROW EXECUTE FUNCTION public.trainers_view_security_barrier();

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
CREATE POLICY "Avatar images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
