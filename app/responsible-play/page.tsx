import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "Responsible Play" };
export default function ResponsiblePlay() {
  return (
    <InfoPage eyebrow="Responsible play" title="Enter Responsibly">
      <p>TopDraw competitions are for UK residents aged 18 or over. Set sensible limits, only enter what you can afford, and do not treat prize competitions as a way to make money.</p>
    </InfoPage>
  );
}
