import { ArchivedComparison, archivedComparisonMetadata } from "@/components/marketing/archived-comparison";
import { loadCompetitors } from "@/lib/seo/content";
export async function generateStaticParams() { return (await loadCompetitors()).map(entry => ({ competitor: entry.slug })); }
export async function generateMetadata({ params }: { params: { competitor: string } }) { return archivedComparisonMetadata(params.competitor, "vs"); }
export default function Page({ params }: { params: { competitor: string } }) { return <ArchivedComparison slug={params.competitor} />; }
