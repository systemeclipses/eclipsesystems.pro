import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faBriefcase, faChartLine, faStore, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import type { PackageIcon as PackageIconName } from "../../content/packages";

const icons = {
  operations: faBriefcase,
  portal: faUserGroup,
  crm: faChartLine,
  storefront: faStore
} satisfies Record<PackageIconName, IconDefinition>;

export function PackageIcon({ icon }: { icon: PackageIconName }) {
  return (
    <span className="package-icon" aria-hidden="true">
      <FontAwesomeIcon icon={icons[icon]} />
    </span>
  );
}
