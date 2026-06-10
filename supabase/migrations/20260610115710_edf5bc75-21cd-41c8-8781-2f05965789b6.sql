CREATE TABLE public.participant_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded','failed')),
  amount_cents integer NOT NULL DEFAULT 1000,
  currency text NOT NULL DEFAULT 'eur',
  provider text NOT NULL DEFAULT 'stripe',
  provider_reference text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.participant_payments TO authenticated;
GRANT ALL ON public.participant_payments TO service_role;

ALTER TABLE public.participant_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment"
  ON public.participant_payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON public.participant_payments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage payments"
  ON public.participant_payments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX participant_payments_user_id_idx ON public.participant_payments(user_id);
