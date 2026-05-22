import { AccountTransactionsPage } from "../AccountPages";

export const metadata = { title: "Transactions", robots: { index: false, follow: false } };

export default function Transactions() {
  return <AccountTransactionsPage />;
}
