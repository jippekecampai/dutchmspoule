import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Gamepad2, Trophy, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.46 2.23-1.2 3.02-.79.85-2.08 1.51-3.14 1.43-.13-1.12.42-2.28 1.13-3.04.79-.85 2.18-1.5 3.21-1.41zM20.5 17.39c-.56 1.3-.83 1.88-1.55 3.03-1.01 1.6-2.43 3.59-4.2 3.61-1.57.02-1.97-1.02-4.1-1.01-2.13.01-2.57 1.03-4.14 1.01-1.77-.02-3.12-1.82-4.13-3.42C-.27 17.46-.6 12.5 1.05 9.86c1.18-1.89 3.04-3 4.79-3 1.78 0 2.9 1 4.37 1 1.43 0 2.3-1 4.36-1 1.56 0 3.21.85 4.39 2.32-3.86 2.12-3.23 7.63 1.54 8.21z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    if (!email || !password || !displayName) {
      toast.error("Vul alle velden in");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Account aangemaakt! Check je e-mail om te bevestigen.");
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error("Vul e-mail en wachtwoord in");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Ingelogd!");
      navigate({ to: "/poule" });
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      const { lovable } = await import("@/integrations/lovable/index");
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}/poule`,
      });
      if (result.error) toast.error(result.error.message || `${provider} login mislukt`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="px-4 py-8">
      <div className="mx-auto flex w-full max-w-5xl items-center">
        <div className="pixel-card grid w-full overflow-hidden p-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="pattern-1988 relative hidden overflow-hidden p-10 text-white lg:block">
            <div className="flag-strip absolute inset-x-0 bottom-0" />
            <div className="relative flex h-full flex-col justify-between [text-shadow:1px_1px_0_rgb(0_0_0/0.5)]">
              <div>
                <div className="pixel-heading mb-8 flex items-center gap-3 text-xs">
                  <div className="flex h-11 w-11 items-center justify-center border-[3px] border-white bg-navy shadow-[3px_3px_0_0_rgb(0_0_0/0.5)]">
                    <Gamepad2 className="h-5 w-5 text-oranje" />
                  </div>
                  DutchMSP Poule
                </div>
                <h1 className="pixel-heading text-lg leading-relaxed">
                  Log in en vul je WK-voorspellingen in.
                </h1>
                <p className="mt-4 text-lg font-medium">
                  Eén account voor je voorspellingen, punten en klassement.
                </p>
              </div>
              <div className="border-[3px] border-white/60 bg-navy/70 p-5 backdrop-blur">
                <div className="pixel-heading mb-3 flex items-center gap-2 text-[0.6rem] text-oranje-light">
                  <Trophy className="h-4 w-4" />
                  DutchMSP WK Poule
                </div>
                <p className="text-white/90">
                  Betaal via de QR-code op de poulepagina en speel mee zodra je deelname bevestigd is.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-7 lg:hidden">
              <div className="pixel-heading mb-4 flex items-center gap-3 text-xs text-foreground">
                <div className="pattern-1988 flex h-10 w-10 items-center justify-center border-2 border-foreground text-white">
                  <Gamepad2 className="h-5 w-5" />
                </div>
                DutchMSP Poule
              </div>
            </div>

            <h1 className="pixel-heading text-lg text-foreground sm:text-xl">Inloggen</h1>
            <p className="mt-3 text-muted-foreground">
              Log in met Google of Apple. Na inloggen ga je direct naar de poule.
            </p>

            <div className="mt-7 space-y-4">
              <button
                onClick={() => handleOAuth("google")}
                disabled={loading}
                className="pixel-btn flex w-full items-center justify-center gap-3 bg-oranje px-4 py-3.5 text-primary-foreground transition hover:bg-oranje-dark disabled:opacity-60"
              >
                <GoogleIcon className="h-5 w-5 rounded-full bg-white" />
                Inloggen met Google
              </button>
              <button
                onClick={() => handleOAuth("apple")}
                disabled={loading}
                className="pixel-btn flex w-full items-center justify-center gap-3 bg-secondary px-4 py-3.5 text-foreground transition hover:bg-accent disabled:opacity-60"
              >
                <AppleIcon className="h-5 w-5" />
                Inloggen met Apple
              </button>
            </div>

            {!showEmail && (
              <div className="mt-7 text-center">
                <button
                  onClick={() => setShowEmail(true)}
                  className="inline-flex items-center gap-2 text-muted-foreground underline underline-offset-4 transition hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                  Of log in met e-mail en wachtwoord
                </button>
              </div>
            )}

            {showEmail && (
            <>
            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="pixel-heading text-[0.55rem] text-muted-foreground">met e-mail</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-none border-2 border-oranje/40 bg-muted p-1">
                <TabsTrigger value="login" className="rounded-none">Inloggen</TabsTrigger>
                <TabsTrigger value="register" className="rounded-none">Registreren</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 pt-5">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jouw@email.nl" className="mt-1 h-11 rounded-none border-2 border-oranje/40" />
                </div>
                <div>
                  <Label htmlFor="password">Wachtwoord</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 h-11 rounded-none border-2 border-oranje/40" />
                </div>
                <Button className="pixel-btn h-11 w-full bg-navy-light text-foreground hover:bg-secondary" onClick={handleSignIn} disabled={loading}>
                  {loading ? "Bezig..." : "Inloggen"}
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 pt-5">
                <div>
                  <Label htmlFor="name">Naam</Label>
                  <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Je naam" className="mt-1 h-11 rounded-none border-2 border-oranje/40" />
                </div>
                <div>
                  <Label htmlFor="email-reg">E-mail</Label>
                  <Input id="email-reg" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jouw@email.nl" className="mt-1 h-11 rounded-none border-2 border-oranje/40" />
                </div>
                <div>
                  <Label htmlFor="password-reg">Wachtwoord</Label>
                  <Input id="password-reg" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 h-11 rounded-none border-2 border-oranje/40" />
                </div>
                <Button className="pixel-btn h-11 w-full bg-oranje text-primary-foreground hover:bg-oranje-dark" onClick={handleSignUp} disabled={loading}>
                  {loading ? "Bezig..." : "Account aanmaken"}
                </Button>
              </TabsContent>
            </Tabs>
            </>
            )}

            <div className="mt-8 text-center">
              <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Terug naar home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
