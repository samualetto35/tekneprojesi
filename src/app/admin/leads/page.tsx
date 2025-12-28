import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import LeadsList from "@/components/admin/LeadsList";

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

export default async function LeadsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; listing_id?: string; sort?: string; search?: string }> | { status?: string; listing_id?: string; sort?: string; search?: string };
}) {
  const supabase = await getAuthenticatedSupabaseClient();

  // Resolve searchParams if it's a Promise
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams;

  // Build query
  let query = supabase
    .from("leads")
    .select(`
      *,
      listings:listing_id (
        id,
        title,
        location,
        capacity,
        captain_name,
        captain_phone,
        captain_email,
        currency,
        price_hourly,
        price_daily,
        price_stay_per_night,
        commission_rate,
        min_hours,
        min_stay_days
      )
    `);

  // Apply filters
  const status = resolvedSearchParams?.status;
  const listingId = resolvedSearchParams?.listing_id;
  const sortParam = resolvedSearchParams?.sort || "newest";
  const searchQuery = resolvedSearchParams?.search;

  if (status) {
    query = query.eq("status", status);
  }

  if (listingId) {
    query = query.eq("listing_id", listingId);
  }

  // Apply sorting
  switch (sortParam) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "name_asc":
      query = query.order("customer_name", { ascending: true });
      break;
    case "name_desc":
      query = query.order("customer_name", { ascending: false });
      break;
    case "date_asc":
      query = query.order("start_timestamp", { ascending: true });
      break;
    case "date_desc":
      query = query.order("start_timestamp", { ascending: false });
      break;
    case "price_asc":
    case "price_desc":
    case "captain_asc":
    case "captain_desc":
      // These will be sorted client-side
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data: leads } = await query;

  // Apply client-side search filtering if search query exists
  let filteredLeads = leads || [];
  if (searchQuery) {
    const searchLower = searchQuery.toLowerCase();
    filteredLeads = filteredLeads.filter((lead: any) => 
      lead.customer_name?.toLowerCase().includes(searchLower) ||
      lead.customer_phone?.includes(searchQuery) ||
      lead.listings?.title?.toLowerCase().includes(searchLower) ||
      lead.listings?.location?.toLowerCase().includes(searchLower) ||
      lead.listings?.captain_name?.toLowerCase().includes(searchLower) ||
      lead.listings?.captain_email?.toLowerCase().includes(searchLower) ||
      lead.listings?.captain_phone?.includes(searchQuery)
    );
  }

  // Get all listings for filter dropdown
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, location")
    .order("title");

  // Get status counts
  const { data: statusCounts } = await supabase
    .from("leads")
    .select("status");

  const counts: Record<string, number> = {
    new: 0,
    contacted: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  };

  statusCounts?.forEach((lead: any) => {
    if (lead.status && counts.hasOwnProperty(lead.status)) {
      counts[lead.status]++;
    }
  });

  return (
    <LeadsList
      leads={filteredLeads}
      listings={listings || []}
      statusCounts={counts}
      currentStatus={status}
      currentListingId={listingId}
      currentSort={sortParam}
      currentSearch={searchQuery}
    />
  );
}

