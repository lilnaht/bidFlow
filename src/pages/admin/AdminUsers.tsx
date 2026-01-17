import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProfiles, updateUserRole } from "@/integrations/supabase/queries";

const roleLabels = {
  admin: "Admin",
  staff: "Staff",
};

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: profiles = [], isLoading, error } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
  });

  const mutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: "admin" | "staff" }) =>
      updateUserRole(id, role),
    onMutate: ({ id }) => {
      setUpdatingId(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({
        title: "Permissao atualizada",
        description: "O cargo do usuario foi alterado.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Nao foi possivel alterar a permissao.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUpdatingId(null);
    },
  });

  if (error) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="font-display text-xl font-bold text-foreground">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Nao foi possivel carregar os usuarios.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Usuarios</h1>
        <p className="text-muted-foreground">
          Defina permissoes de acesso entre admin e staff.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Equipe cadastrada</CardTitle>
          <CardDescription>
            O admin pode alterar permissoes de outros usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Carregando usuarios...
            </div>
          ) : profiles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nenhum usuario encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Permissao</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => {
                  const isSelf = profile.id === user?.id;
                  return (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {profile.full_name ?? "Usuario sem nome"}
                        </div>
                        {isSelf && (
                          <span className="text-xs text-muted-foreground">Voce</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {profile.email ?? "Sem e-mail"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{roleLabels[profile.role]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={profile.role}
                          onValueChange={(value) =>
                            mutation.mutate({ id: profile.id, role: value as "admin" | "staff" })
                          }
                          disabled={updatingId === profile.id}
                        >
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
