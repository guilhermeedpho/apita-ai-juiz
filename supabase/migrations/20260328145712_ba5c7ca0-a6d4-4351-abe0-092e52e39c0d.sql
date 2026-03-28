CREATE POLICY "Users can delete their own pending matches"
ON public.matches
FOR DELETE
TO authenticated
USING (auth.uid() = requester_id AND status = 'pending');