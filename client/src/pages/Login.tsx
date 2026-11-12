import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { ShieldCheck, Zap } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

const ACCESS_KEY = "msre-access-mode";

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      localStorage.setItem(ACCESS_KEY, "staff");
      setLocation("/");
    }
  }, [isAuthenticated, loading, setLocation]);

  const enterDemo = () => {
    localStorage.setItem(ACCESS_KEY, "public-demo");
    setLocation("/");
  };

  const enterStaffLogin = () => {
    localStorage.setItem(ACCESS_KEY, "staff");
    window.location.href = getLoginUrl();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <Card className="w-full max-w-md border-border/80 shadow-xl">
        <CardHeader className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Zap className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-2xl">MUNRO and Sons Roofing Experts</CardTitle>
            <CardDescription className="mt-2">
              MSRE roofing CRM access
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" className="min-h-12 w-full gap-2" onClick={enterDemo}>
            <Zap className="h-4 w-4" />
            Continue to Public Demo
          </Button>
          <Button type="button" variant="outline" className="min-h-12 w-full gap-2" onClick={enterStaffLogin}>
            <ShieldCheck className="h-4 w-4" />
            Staff Login
          </Button>
          <p className="pt-2 text-center text-xs leading-5 text-muted-foreground">
            The demo uses sample CRM data. Staff Login uses the secure Manus account sign-in flow for private access.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
