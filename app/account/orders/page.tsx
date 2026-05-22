import { AccountOrdersPage } from "../AccountPages";

export const metadata = { title: "Orders", robots: { index: false, follow: false } };

export default function Orders() {
  return <AccountOrdersPage />;
}
