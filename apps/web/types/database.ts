export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: { Row: { id: string; email: string; full_name: string | null; default_organization_id: string | null } };
      organizations: { Row: { id: string; name: string; kind: "personal" | "team" } };
      memberships: { Row: { id: string; organization_id: string; user_id: string; role: "owner" | "admin" | "manager" | "member" } };
      time_entries: { Row: { id: string; organization_id: string; membership_id: string; description: string | null; started_at: string; ended_at: string | null; duration_seconds: number | null; status: string } };
      projects: { Row: { id: string; organization_id: string; name: string } };
      tasks: { Row: { id: string; organization_id: string; project_id: string; name: string } };
      invoices: { Row: { id: string; organization_id: string; number: string; total: string; status: string } };
      subscriptions: { Row: { id: string; organization_id: string; plan: "starter" | "pro" | "business" | "legal"; seats: number; status: string } };
    };
    Functions: {
      org_has_feature: { Args: { org_id: string; feature: string }; Returns: boolean };
      my_membership_id: { Args: { org_id: string }; Returns: string | null };
    };
  };
};
