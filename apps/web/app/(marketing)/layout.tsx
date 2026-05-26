import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `(() => { document.documentElement.classList.remove("dark"); document.documentElement.style.colorScheme = "light"; })();`
        }}
      />
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
