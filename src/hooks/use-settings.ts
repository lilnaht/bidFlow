import { useQuery } from "@tanstack/react-query";
import { fetchSettings } from "@/integrations/supabase/queries";

const fallbackSettings = {
  companyName: "bidFlow",
  companyEmail: "contato@proorcamento.com",
  companyPhone: "(11) 99999-9999",
  companyAddress: "Sao Paulo, SP",
};

export const useSettings = () => {
  const query = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const settings = query.data ?? null;

  return {
    ...query,
    settings,
    companyName: settings?.company_name ?? fallbackSettings.companyName,
    companyEmail: settings?.company_email ?? fallbackSettings.companyEmail,
    companyPhone: settings?.company_phone ?? fallbackSettings.companyPhone,
    companyAddress: settings?.company_address ?? fallbackSettings.companyAddress,
  };
};
