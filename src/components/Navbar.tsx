import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Gamepad2, LogOut, User, Trophy, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [user, setUser] = useState<null | { id: string; email?: string }>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email });
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setUser({ id: session.user.id, email: session.user.email });
      else setUser(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-oranje">
            <Gamepad2 className="h-4 w-4 text-white" />
          </div>
          DutchMSP Poule
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/poule">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ListOrdered className="h-4 w-4" />
              <span className="hidden sm:inline">Poule</span>
            </Button>
          </Link>
          <Link to="/leaderboard">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Klassement</span>
            </Button>
          </Link>

          {user ? (
            <>
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Uitloggen</span>
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-oranje text-white hover:bg-oranje-dark gap-1.5">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Inloggen</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
