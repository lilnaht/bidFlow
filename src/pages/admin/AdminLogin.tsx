import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/hooks/use-settings";
import logoMark from "@/assets/logo2.png";

type LoginFormValues = {
  email: string;
  password: string;
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isLoading } = useAuth();
  const { companyName } = useSettings();
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? "/admin";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!isLoading && session) {
      navigate(from, { replace: true });
    }
  }, [from, isLoading, navigate, session]);

  if (!isLoading && session) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      toast({
        title: "Falha no login",
        description: "Verifique seu e-mail e senha.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Bem-vindo",
      description: "Login realizado com sucesso.",
    });
    navigate(from, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-secondary">
              <img
                src={logoMark}
                alt={companyName ? `${companyName} logo` : "Logo"}
                className="h-8 w-8 object-contain"
              />
            </div>
            <span className="font-display text-lg font-semibold text-foreground">
              {companyName}
            </span>
          </div>
          <CardTitle className="text-2xl">Entrar no painel</CardTitle>
          <CardDescription>Use seu e-mail e senha cadastrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register("email", { required: true })} />
              {errors.email && (
                <p className="text-sm text-destructive">Informe seu e-mail.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" {...register("password", { required: true })} />
              {errors.password && (
                <p className="text-sm text-destructive">Informe sua senha.</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
