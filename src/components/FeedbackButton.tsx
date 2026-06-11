import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquarePlus, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { submitFeedback } from "@/lib/pool.functions";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

/*
 * Zwevende "Opmerking"-knop, op elke pagina rechtsonder.
 * Ingelogde deelnemers sturen issues/vragen in; die komen in het admincenter.
 */
export function FeedbackButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const submit = useServerFn(submitFeedback);
  const mutation = useMutation({
    mutationFn: submit,
    onSuccess: () => {
      setMessage("");
      setOpen(false);
      toast.success(t("Bedankt! Je opmerking is doorgestuurd naar de organisator.", "Thanks! Your comment has been forwarded to the organiser."));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Opmerking of vraag insturen"
        className="pixel-btn fixed bottom-5 right-5 z-[90] flex items-center gap-2 bg-oranje px-4 py-3 text-primary-foreground hover:bg-oranje-dark"
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span className="hidden sm:inline">{t("Opmerking", "Feedback")}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[95] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="pixel-card w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="pixel-heading text-[0.7rem] text-oranje">{t("Opmerking of vraag", "Comment or question")}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Sluiten"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loggedIn ? (
              <>
                <p className="mb-3 text-muted-foreground">
                  {t("Loop je ergens tegenaan of heb je een vraag? De organisator ziet je bericht in het admincenter.", "Running into something or got a question? The organiser sees your message in the admin centre.")}
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder={t("Bijv. mijn betaling staat nog op 'open', of: de uitslag van wedstrijd 2 klopt niet…", "E.g. my payment is still 'open', or: the result of match 2 is wrong…")}
                  className="w-full resize-none border-2 border-oranje/50 bg-input p-3 text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-oranje"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">{message.length}/2000</span>
                  <Button
                    className="pixel-btn bg-oranje text-primary-foreground hover:bg-oranje-dark"
                    disabled={mutation.isPending || message.trim().length === 0}
                    onClick={() => mutation.mutate({ data: { message } })}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {mutation.isPending ? t("Versturen...", "Sending...") : t("Verstuur", "Send")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-4 text-muted-foreground">
                  {t("Log eerst in om een opmerking of vraag in te sturen, dan weet de organisator van wie het bericht komt.", "Log in first to send a comment or question, so the organiser knows who it is from.")}
                </p>
                <Link to="/auth" onClick={() => setOpen(false)}>
                  <Button className="pixel-btn w-full bg-oranje text-primary-foreground hover:bg-oranje-dark">
                    {t("Inloggen / Registreren", "Log in / Register")}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
