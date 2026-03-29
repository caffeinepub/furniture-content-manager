import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { Loader2, LogIn, LogOut, Sofa } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function Navigation() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const location = useLocation();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const navLinks = [
    { to: "/", label: "Gallery", ocid: "nav.gallery.link" },
    { to: "/attendance", label: "Attendance", ocid: "nav.attendance.link" },
    { to: "/admin", label: "Admin", ocid: "nav.admin.link" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2 group"
            data-ocid="nav.link"
          >
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
              <Sofa className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight text-foreground">
              Satya Furniture
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, ocid }) => (
              <Link
                key={to}
                to={to}
                data-ocid={ocid}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === to
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <Button
          variant={isAuthenticated ? "outline" : "default"}
          size="sm"
          onClick={handleAuth}
          disabled={isLoggingIn}
          data-ocid="nav.auth.button"
          className="gap-2"
        >
          {isLoggingIn ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isAuthenticated ? (
            <LogOut className="w-4 h-4" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          {isLoggingIn
            ? "Signing in..."
            : isAuthenticated
              ? "Sign out"
              : "Sign in"}
        </Button>
      </div>
    </header>
  );
}
