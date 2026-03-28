
-- Support messages table for user-to-admin communication
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_reply text,
  created_at timestamptz NOT NULL DEFAULT now(),
  replied_at timestamptz
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Users can create their own support messages
CREATE POLICY "Users can create support messages"
ON public.support_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own support messages
CREATE POLICY "Users can view own support messages"
ON public.support_messages FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all support messages
CREATE POLICY "Admins can view all support messages"
ON public.support_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update support messages (reply)
CREATE POLICY "Admins can update support messages"
ON public.support_messages FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin DELETE policies on existing tables
CREATE POLICY "Admins can delete matches"
ON public.matches FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete referees"
ON public.referees FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reviews"
ON public.reviews FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete verifications"
ON public.identity_verifications FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user_roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can delete their own profile data
CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own referee data"
ON public.referees FOR DELETE TO authenticated
USING (auth.uid() = user_id);
