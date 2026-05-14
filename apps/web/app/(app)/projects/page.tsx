import { requireFeature } from "@/lib/plan-features";
import { getActiveOrgId } from "@/lib/org";
import { createServerClient } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const orgId = await getActiveOrgId();
  await requireFeature(orgId, "projects");
  const supabase = createServerClient();
  const { data } = await supabase.from("projects").select("id,name,code").eq("organization_id", orgId);
  return <List title="Projects" items={(data ?? []).map((item) => item.name)} />;
}

function List({ title, items }: { title: string; items: string[] }) {
  return <section><h1 className="text-2xl font-semibold">{title}</h1><div className="mt-6 grid gap-2">{items.map((item) => <div key={item} className="rounded-md border border-border p-3">{item}</div>)}</div></section>;
}
