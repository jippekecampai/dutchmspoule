-- Persoonlijke records van het 8-bit mini-spelletje op de homepage.
CREATE TABLE public.game_highscores (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goals_for integer NOT NULL DEFAULT 0 CHECK (goals_for >= 0 AND goals_for <= 99),
  goals_against integer NOT NULL DEFAULT 0 CHECK (goals_against >= 0 AND goals_against <= 99),
  opponent text,
  achieved_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.game_highscores TO authenticated, anon;
GRANT ALL ON public.game_highscores TO service_role;

ALTER TABLE public.game_highscores ENABLE ROW LEVEL SECURITY;

-- Iedereen mag de ranglijst zien; schrijven kan alleen via de server (service role).
CREATE POLICY "Anyone can view game highscores"
  ON public.game_highscores FOR SELECT
  USING (true);
