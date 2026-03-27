
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referee_id uuid NOT NULL REFERENCES public.referees(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  field_type text NOT NULL,
  location text NOT NULL,
  scheduled_at timestamp with time zone NOT NULL,
  price integer NOT NULL,
  platform_fee integer NOT NULL,
  referee_payout integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matches" ON public.matches
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_id);

CREATE POLICY "Referees can view their matches" ON public.matches
  FOR SELECT TO authenticated
  USING (referee_id IN (SELECT id FROM public.referees WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all matches" ON public.matches
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create matches" ON public.matches
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Admins can update matches" ON public.matches
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
