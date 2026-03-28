ALTER TABLE public.matches ADD COLUMN payment_nsu text;
ALTER TABLE public.matches ADD COLUMN payment_method text;
ALTER TABLE public.matches ADD COLUMN paid_at timestamp with time zone;

-- Allow users to update their own matches status (for payment confirmation)
CREATE POLICY "Users can update their own matches"
ON public.matches
FOR UPDATE
TO authenticated
USING (auth.uid() = requester_id)
WITH CHECK (auth.uid() = requester_id);