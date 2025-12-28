import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import ListingForm from "@/components/admin/ListingForm";

export default async function NewListingPage() {
  await requireAuth();
  
  return <ListingForm />;
}

