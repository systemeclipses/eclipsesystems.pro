export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: { Row: { id: string; email: string; full_name: string | null; default_organization_id: string | null } };
      organizations: { Row: { id: string; name: string; kind: "personal" | "team" } };
      memberships: { Row: { id: string; organization_id: string; user_id: string; role: "superuser" | "owner" | "admin" | "manager" | "member" } };
      membership_product_roles: { Row: { id: string; organization_id: string; membership_id: string; product: "timekeeping" | "eclipse" | "mission_command" | "suite" | "legal_addon"; access_role: "employee" | "admin"; revoked_at: string | null } };
      time_entries: { Row: { id: string; organization_id: string; membership_id: string; description: string | null; started_at: string; ended_at: string | null; duration_seconds: number | null; status: string } };
      projects: { Row: { id: string; organization_id: string; name: string } };
      tasks: { Row: { id: string; organization_id: string; project_id: string; name: string } };
      invoices: { Row: { id: string; organization_id: string; number: string; total: string; status: string } };
      subscriptions: { Row: { id: string; organization_id: string; plan: "timekeeping" | "mission_command" | "eclipse" | "suite" | "legal_addon"; seats: number; status: string } };
      subscription_add_ons: { Row: { id: string; subscription_id: string; organization_id: string; plan: "legal_addon"; seats: number; status: string } };
    };
    Functions: {
      org_has_feature: { Args: { org_id: string; feature: string }; Returns: boolean };
      my_membership_id: { Args: { org_id: string }; Returns: string | null };
    };
  };
};
