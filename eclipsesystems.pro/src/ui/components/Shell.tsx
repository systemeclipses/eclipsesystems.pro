import { Link, NavLink, Outlet } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse } from "@fortawesome/free-solid-svg-icons";
import { faLinkedin, faX } from "@fortawesome/free-brands-svg-icons";
import { useSettingsStore } from "@state/settingsStore";
import { useEffect } from "react";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/pricing", label: "Pricing" },
  { to: "/features", label: "Features" },
  { to: "/contact", label: "Contact" },
  { to: "/guides", label: "Guides" }
];

export function Shell() {
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    if (theme === "system") root.removeAttribute("data-theme");
  }, [theme]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="app-header">
        <Link className="brand-lockup" to="/">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <p className="eyebrow">Eclipse Systems</p>
            <h1>Operations software</h1>
          </div>
        </Link>
        <div className="header-actions">
          <a className="header-link" href="tel:+12055550197">
            (205) 555-0197
          </a>
          <a className="header-link" href="mailto:hello@eclipsesystems.pro">
            hello@eclipsesystems.pro
          </a>
          <a className="header-icon" href="https://www.linkedin.com/company/eclipse-systems" aria-label="LinkedIn">
            <FontAwesomeIcon icon={faLinkedin} />
          </a>
          <a className="header-icon" href="https://twitter.com/eclipsesystems" aria-label="X">
            <FontAwesomeIcon icon={faX} />
          </a>
          <Link className="header-icon home-icon" to="/" aria-label="Home">
            <FontAwesomeIcon icon={faHouse} />
          </Link>
        </div>
      </header>
      <nav className="app-nav" aria-label="Site map">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="app-footer">
        <span>Eclipse Systems</span>
        <span>Timekeeping, operations, billing, and legal add-ons.</span>
        <a href="mailto:hello@eclipsesystems.pro">hello@eclipsesystems.pro</a>
      </footer>
    </>
  );
}
