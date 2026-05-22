import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact TopDraw" };
export default function Contact() {
  return (
    <div className="container mx-auto py-10 max-w-3xl text-white px-4">
      <h1 className="text-3xl md:text-4xl font-black mt-1">Contact</h1>
      <p className="mt-4 text-white/80">For support, get in touch using the details below.</p>
      <div className="rounded-xl border border-white/10 bg-card p-4 text-sm space-y-2 mt-4">
        <div><span className="font-bold text-white">Email:</span> hello@topdrawprizes.co.uk</div>
        <div><span className="font-bold text-white">Website:</span> topdrawcompetitions.co.uk</div>
        <div><span className="font-bold text-white">Promoter:</span> Daniel Lyons trading as TopDraw</div>
        <div><span className="font-bold text-white">Postal address:</span> [Placeholder address to be replaced before launch]</div>
        <div className="pt-2 border-t border-white/10 text-xs text-white/60">TopDraw is a trading name. TopDraw is not currently operated by a registered limited company.</div>
      </div>
    </div>
  );
}
