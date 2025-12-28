import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import AdminDashboard from "@/components/admin/AdminDashboard";

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

export default async function AdminPage() {
  const supabase = await getAuthenticatedSupabaseClient();

  // Get statistics with authenticated client
  const [listingsResult, activeListingsResult, leadsResult] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("leads").select("id", { count: "exact", head: true }),
  ]);

  const totalListings = listingsResult.count ?? 0;
  const activeListings = activeListingsResult.count ?? 0;
  const totalLeads = leadsResult.count ?? 0;

  // Get recent listings with lead counts
  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  // Get lead counts per listing
  const { data: allLeads } = await supabase
    .from("leads")
    .select("listing_id, status");

  // Group leads by listing_id and status
  const leadCountsByListing: Record<
    string,
    { new: number; contacted: number; confirmed: number; cancelled: number; completed: number; total: number }
  > = {};

  listings?.forEach((listing) => {
    leadCountsByListing[listing.id] = {
      new: 0,
      contacted: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      total: 0,
    };
  });

  allLeads?.forEach((lead) => {
    if (leadCountsByListing[lead.listing_id]) {
      const status = lead.status || "new";
      const counts = leadCountsByListing[lead.listing_id];
      if (status === "new") {
        counts.new++;
      } else if (status === "contacted") {
        counts.contacted++;
      } else if (status === "confirmed") {
        counts.confirmed++;
      } else if (status === "cancelled") {
        counts.cancelled++;
      } else if (status === "completed") {
        counts.completed++;
      }
      counts.total++;
    }
  });

  return (
    <AdminDashboard
      totalListings={totalListings}
      activeListings={activeListings}
      totalLeads={totalLeads}
      listings={listings || []}
      leadCountsByListing={leadCountsByListing}
    />
  );
}
