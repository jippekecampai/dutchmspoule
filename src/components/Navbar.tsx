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
    <nav className="sticky top-0 z-50 border-b-[3px] border-oranje bg-navy/95 backdrop-blur">
      <div className="oranje-strip" />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="pixel-heading flex items-center gap-2.5 text-[0.65rem] text-foreground sm:text-xs"
        >
          <div className="pattern-1988 flex h-9 w-9 items-center justify-center border-2 border-foreground">
            <Gamepad2 className="h-4 w-4 text-white" />
          </div>
          DutchMSP Poule
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/poule">
            <Button variant="ghost" size="sm" className="gap-1.5 rounded-none text-base hover:bg-oranje/20 hover:text-oranje-light">
              <ListOrdered className="h-4 w-4" />
              <span className="hidden sm:inline">Poule</span>
            </Button>
          </Link>
          <Link to="/leaderboard">
            <Button variant="ghost" size="sm" className="gap-1.5 rounded-none text-base hover:bg-oranje/20 hover:text-oranje-light">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Klassement</span>
            </Button>
          </Link>

          {user ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 rounded-none text-base hover:bg-oranje/20 hover:text-oranje-light"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Uitloggen</span>
            </Button>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="pixel-btn gap-1.5 bg-oranje text-primary-foreground hover:bg-oranje-dark">
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
