import { AccountEntriesPage } from "../AccountPages";

export const metadata = { title: "My tickets", robots: { index: false, follow: false } };

export default function Entries() {
  return <AccountEntriesPage />;
}
