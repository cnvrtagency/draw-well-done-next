import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "Privacy Policy" };
export default function Privacy() {
  return (
    <InfoPage eyebrow="Legal" title="Privacy Policy">
      <p>TopDraw uses personal information to operate accounts, process entries, administer draws, publish display-safe winner details and provide support.</p>
      <p>Payment information is processed by payment providers. Public winner information is limited to display-safe details.</p>
      <p>Contact hello@topdrawprizes.co.uk for privacy enquiries.</p>
    </InfoPage>
  );
}
