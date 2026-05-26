import { TimekeepingSettingsClient } from "@/components/settings/timekeeping-settings-client";
import { getActiveOrgId } from "@/lib/org";
import { ensureDefaultPtoCategories, getAdminTimekeepingConfig } from "@/src/db/queries/timekeeping";
import { getTimekeepingSettings } from "@/src/db/queries/timekeeping-settings";

export default async function TimekeepingSettingsPage() {
  const organizationId = await getActiveOrgId();
  await ensureDefaultPtoCategories(organizationId);
  const settings = await getTimekeepingSettings(organizationId);
  const config = await getAdminTimekeepingConfig(organizationId);
  return <TimekeepingSettingsClient initialSettings={settings} initialPtoCategories={config.categories} />;
}
