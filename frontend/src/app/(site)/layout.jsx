import SiteShell from "@/components/layout/SiteShell";
import PageTransition from "@/components/layout/PageTransition";

export default function SiteLayout({ children }) {
  return (
    <SiteShell>
      <PageTransition>{children}</PageTransition>
    </SiteShell>
  );
}
