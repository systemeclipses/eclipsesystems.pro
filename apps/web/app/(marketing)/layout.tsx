import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { QuickActionMenu } from "@/components/marketing/quick-action-menu";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `(() => { document.documentElement.classList.remove("dark"); document.documentElement.style.colorScheme = "light"; })();`
        }}
      />
      <SiteHeader />
      <div className="marketing-page-backdrop">{children}</div>
      <QuickActionMenu />
      <SiteFooter />
    </>
  );
}
