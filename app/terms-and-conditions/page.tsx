import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "Terms and Conditions" };
export default function Terms() {
  return (
    <InfoPage eyebrow="Legal" title="Terms and Conditions">
      <p>Prepared for: Daniel Lyons trading as TopDraw. Website: topdrawcompetitions.co.uk. Email: hello@topdrawprizes.co.uk.</p>
      <p>TopDraw operates prize draw competitions with paid online entry and a genuine free postal entry route. Competitions are open to UK residents aged 18 or over only.</p>
      <p>Each competition page states the prize, ticket price, maximum ticket cap, opening and closing dates, draw timing, cash alternative where applicable, and winner information.</p>
      <p>Paid entries and valid free postal entries have the same chance of winning per entry. Ticket numbers are allocated randomly and winners are reviewed before publication.</p>
    </InfoPage>
  );
}
