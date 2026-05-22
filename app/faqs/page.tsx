import type { Metadata } from "next";
import { PublicPageHeader } from "@/components/public-ui/PublicPageHeader";
import { FAQClient } from "./FAQClient";
import { createSupabaseClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "TopDraw Help Centre | Tickets, Winners & Free Entry",
  description: "Find clear answers about TopDraw competitions, ticket numbers, free postal entry, winners, prize claims, account support and how the draw process works.",
};

export default async function FAQs() {
  const supabase = createSupabaseClient();
  let items: any[] = [];
  if (supabase) {
    const { data } = await supabase.from("faq_items").select("id,category,question,answer,sort_order").eq("is_published", true).is("archived_at", null).order("category", { ascending: true }).order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    items = data ?? [];
  }
  return (
    <div className="theme-dark relative">
      <section className="container mx-auto px-4 pt-8 md:pt-10">
        <PublicPageHeader align="left" eyebrow="Help Centre" title="Questions Before You Enter?" description="Find clear answers about TopDraw competitions, ticket numbers, free postal entry, winners, prize claims, account support and how the draw process works." />
      </section>
      <FAQClient items={items} />
    </div>
  );
}
