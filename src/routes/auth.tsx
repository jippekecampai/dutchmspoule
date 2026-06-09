import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Football, Mail, Globe } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
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
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account aangemaakt! Check je e-mail om te bevestigen.");
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error("Vul e-mail en wachtwoord in");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Ingelogd!");
      navigate({ to: "/poule" });
    }
  };

  const handleGoogle = async () => {
    const { lovable } = await import("@/integrations/lovable/index");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message || "Google login mislukt");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-oranje">
            <Football className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">DutchMSP WK Poule</h1>
          <p className="text-sm text-muted-foreground">Log in om mee te doen</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Inloggen</TabsTrigger>
            <TabsTrigger value="register">Registreren</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jouw@email.nl"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Wachtwoord</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  className="w-full bg-oranje text-white hover:bg-oranje-dark"
                  onClick={handleSignIn}
                  disabled={loading}
                >
                  {loading ? "Bezig..." : "Inloggen"}
                </Button>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">of</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleGoogle}>
                  <Globe className="mr-2 h-4 w-4" />
                  Inloggen met Google
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="register">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Naam</Label>
                  <Input
                    id="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Je naam"
                  />
                </div>
                <div>
                  <Label htmlFor="email-reg">E-mail</Label>
                  <Input
                    id="email-reg"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jouw@email.nl"
                  />
                </div>
                <div>
                  <Label htmlFor="password-reg">Wachtwoord</Label>
                  <Input
                    id="password-reg"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  className="w-full bg-oranje text-white hover:bg-oranje-dark"
                  onClick={handleSignUp}
                  disabled={loading}
                >
                  {loading ? "Bezig..." : "Account aanmaken"}
                </Button>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">of</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleGoogle}>
                  <Globe className="mr-2 h-4 w-4" />
                  Registreren met Google
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/" className="underline hover:text-foreground">
            Terug naar home
          </Link>
        </p>
      </div>
    </div>
  );
}
