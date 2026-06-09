import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ArrowLeft } from "lucide-react";
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
  const [emailOpen, setEmailOpen] = useState(false);
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
    const { lovable } = await import("@/integrations/lovable/index");
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error(result.error.message || `${provider} login mislukt`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-6 text-2xl font-extrabold tracking-tight text-foreground">
          Dutch MSP WK Poule
        </div>

        <h1 className="mb-2 text-4xl font-extrabold text-foreground">Login</h1>
        <p className="mb-8 text-muted-foreground">
          Login om mee te doen met de WK Poule en je voorspellingen te beheren.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleOAuth("apple")}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 font-medium text-black transition hover:bg-white/90"
          >
            <AppleIcon className="h-5 w-5" />
            Inloggen met Apple
          </button>
          <button
            onClick={() => handleOAuth("google")}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-muted px-4 py-3 font-medium text-foreground transition hover:bg-muted/70"
          >
            <GoogleIcon className="h-5 w-5" />
            Inloggen met Google
          </button>
        </div>

        <div className="my-6 border-t border-border" />

        <button
          onClick={() => setEmailOpen((v) => !v)}
          className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          Geen Apple of Google?
          <ChevronDown className={`h-4 w-4 transition-transform ${emailOpen ? "rotate-180" : ""}`} />
        </button>

        {emailOpen && (
          <div className="mt-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Inloggen</TabsTrigger>
                <TabsTrigger value="register">Registreren</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jouw@email.nl" />
                </div>
                <div>
                  <Label htmlFor="password">Wachtwoord</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <Button className="w-full bg-oranje text-white hover:bg-oranje-dark" onClick={handleSignIn} disabled={loading}>
                  {loading ? "Bezig..." : "Inloggen"}
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="name">Naam</Label>
                  <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Je naam" />
                </div>
                <div>
                  <Label htmlFor="email-reg">E-mail</Label>
                  <Input id="email-reg" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jouw@email.nl" />
                </div>
                <div>
                  <Label htmlFor="password-reg">Wachtwoord</Label>
                  <Input id="password-reg" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <Button className="w-full bg-oranje text-white hover:bg-oranje-dark" onClick={handleSignUp} disabled={loading}>
                  {loading ? "Bezig..." : "Account aanmaken"}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Terug naar home
          </Link>
        </div>
      </div>
    </div>
  );
}
