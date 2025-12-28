import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Don't check auth for login page - it will handle its own redirect
  // Other pages will use requireAuth() in their page components
  
  return (
    <div className="admin-layout" style={{ minHeight: '100vh' }}>
      {children}
    </div>
  );
}
