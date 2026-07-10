import { redirect } from "next/navigation";

export default function ScheduleDemoRedirect({ searchParams }: { searchParams?: { demo?: string } }) {
  const selectedDemo = searchParams?.demo;

  redirect(selectedDemo ? `/contact?demo=${encodeURIComponent(selectedDemo)}` : "/contact");
}
