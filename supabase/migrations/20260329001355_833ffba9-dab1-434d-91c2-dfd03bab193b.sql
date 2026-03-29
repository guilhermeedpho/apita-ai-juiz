CREATE POLICY "Referees can update their own matches"
ON public.matches
FOR UPDATE
TO authenticated
USING (
  referee_id IN (
    SELECT id FROM public.referees WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  referee_id IN (
    SELECT id FROM public.referees WHERE user_id = auth.uid()
  )
);