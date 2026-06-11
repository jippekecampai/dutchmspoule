-- Opmerkingen/vragen van deelnemers, zichtbaar in het admincenter.
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (char_length(message) >= 1 AND char_length(message) <= 2000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Eigen opmerkingen teruglezen mag; schrijven en beheren loopt via de server.
CREATE POLICY "Users can view own feedback"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
