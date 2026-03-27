CREATE POLICY "Users can insert their own referee role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'referee'::app_role);