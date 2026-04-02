CREATE OR REPLACE VIEW public.trainers AS
SELECT
  tr.id,
  tr.user_id,
  tr.name,
  p.avatar_url,
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
