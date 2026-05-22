import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "Free Postal Entry Route" };
export default function FreeEntry() {
  return (
    <InfoPage eyebrow="Free Postal Entry" title="Free Postal Entry">
      <h2 className="text-xl md:text-2xl font-bold text-white mt-10 pt-4 border-t border-white/10">Free Postal Entry Route</h2>
      <p className="text-white/75">You can enter TopDraw paid competitions for free by post.</p>
      <p className="text-white/75">No purchase is required to enter by post. Postal entries have the same chance of winning per valid entry as paid online entries.</p>
      <h2 className="text-xl md:text-2xl font-bold text-white mt-10 pt-4 border-t border-white/10">How to Enter for Free</h2>
      <p className="text-white/75">Send a postcard or letter to:</p>
      <pre className="whitespace-pre-line bg-card border border-white/10 p-3 rounded text-white/80 text-sm">{`TopDraw Free Entry\n[Insert postal address]`}</pre>
      <p className="text-white/75">Your postal entry must include:</p>
      <ul className="list-disc list-outside pl-6 space-y-1.5 text-white/75">
        <li>the name of the competition you wish to enter;</li>
        <li>your full name;</li>
        <li>your date of birth;</li>
        <li>your email address;</li>
        <li>your phone number;</li>
        <li>your full postal address;</li>
        <li>a statement confirming that you are a UK resident aged 18 or over and that you agree to the TopDraw Terms and Conditions.</li>
      </ul>
      <h2 className="text-xl md:text-2xl font-bold text-white mt-10 pt-4 border-t border-white/10">Postal Entry Rules</h2>
      <ul className="list-disc list-outside pl-6 space-y-1.5 text-white/75">
        <li>Each postal entry must be sent separately.</li>
        <li>Bulk entries in the same envelope will not be accepted.</li>
        <li>Hand-delivered entries will not be accepted.</li>
        <li>Postal entries must be received before the competition closes.</li>
        <li>Postal entries received after a competition has closed, after all ticket numbers have been allocated, or after the relevant closing date will not be entered.</li>
        <li>You are responsible for the normal cost of sending your postal entry.</li>
      </ul>
      <h2 className="text-xl md:text-2xl font-bold text-white mt-10 pt-4 border-t border-white/10">Entry Limits</h2>
      <p className="text-white/75">The maximum number of entries per person for each competition is shown on the relevant competition page.</p>
      <p className="text-white/75">The same maximum entry limit applies to paid entries and postal entries.</p>
      <p className="text-white/75">For example, if a competition allows 25 entries per person, you may enter up to 25 times using paid entries, postal entries, or a combination of both.</p>
      <h2 className="text-xl md:text-2xl font-bold text-white mt-10 pt-4 border-t border-white/10">Ticket Allocation</h2>
      <p className="text-white/75">Valid postal entries will be processed by TopDraw and allocated ticket numbers randomly.</p>
      <p className="text-white/75">Postal entries have the same chance of winning per entry as paid online entries.</p>
    </InfoPage>
  );
}
