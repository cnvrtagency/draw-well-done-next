import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "Cookie Policy" };
export default function Cookies() {
  return (
    <InfoPage eyebrow="Legal" title="Cookie Policy">
      <p>TopDraw may use essential cookies for site operation, authentication and checkout. Analytics or marketing cookies should only be used where configured with appropriate consent controls.</p>
    </InfoPage>
  );
}
