import { AccountOverviewPage } from "./AccountPages";

export const metadata = { title: "My account", robots: { index: false, follow: false } };

export default function Account() {
  return <AccountOverviewPage />;
}
