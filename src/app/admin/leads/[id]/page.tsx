import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import LeadDetail from "@/components/admin/LeadDetail";

async function getAuthenticatedSupabaseClient() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  const refreshToken = cookieStore.get("sb-refresh-token")?.value;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } else {
    redirect("/admin/login");
  }

  return supabase;
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await getAuthenticatedSupabaseClient();
  const { id } = await params;

  const { data: lead } = await supabase
    .from("leads")
    .select(`
      *,
      listings:listing_id (
        id,
        title,
        location,
        capacity
      )
    `)
    .eq("id", id)
    .single();

  if (!lead) {
    redirect("/admin/leads");
  }

  return <LeadDetail lead={lead} />;
}

