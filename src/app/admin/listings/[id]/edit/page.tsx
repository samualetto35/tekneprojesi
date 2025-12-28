import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import ListingForm from "@/components/admin/ListingForm";

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

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await getAuthenticatedSupabaseClient();
  
  const { id } = await params;
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (!listing) {
    redirect("/admin");
  }

  return <ListingForm listing={listing} />;
}

