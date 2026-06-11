-- Inleg verhoogd van €10 naar €15. Pas de standaardwaarde aan en trek
-- bestaande rijen die nog op de oude €10-default stonden gelijk.
ALTER TABLE public.participant_payments
  ALTER COLUMN amount_cents SET DEFAULT 1500;

UPDATE public.participant_payments
  SET amount_cents = 1500
  WHERE amount_cents = 1000;
