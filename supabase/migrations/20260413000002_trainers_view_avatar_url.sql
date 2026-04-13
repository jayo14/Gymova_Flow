-- Recreate the trainers view to append avatar_url at the end of the column list

-- Drop the read-only trigger first since we may need to replace the view
DROP TRIGGER IF EXISTS trainers_view_read_only ON public.trainers;

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
  tr.reviews_list,
  p.avatar_url
FROM public.trainer_records tr
JOIN public.profiles p ON p.id = tr.user_id
LEFT JOIN public.trainer_locations tl ON tl.trainer_id = tr.id AND tl.is_primary = true
LEFT JOIN public.gym_locations gl ON gl.id = tl.gym_location_id
WHERE p.role = 'trainer' AND p.trainer_status = 'approved';

-- Re-attach the trigger after replacing the view
CREATE TRIGGER trainers_view_read_only
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.trainers
FOR EACH ROW EXECUTE FUNCTION public.trainers_view_security_barrier();
