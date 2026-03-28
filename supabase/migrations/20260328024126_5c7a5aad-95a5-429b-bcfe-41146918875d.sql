
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Participants of a match can read messages
CREATE POLICY "Match participants can read messages"
ON public.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id
    AND (m.requester_id = auth.uid() OR m.referee_id IN (SELECT r.id FROM public.referees r WHERE r.user_id = auth.uid()))
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Participants can send messages
CREATE POLICY "Match participants can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id
    AND (m.requester_id = auth.uid() OR m.referee_id IN (SELECT r.id FROM public.referees r WHERE r.user_id = auth.uid()))
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
