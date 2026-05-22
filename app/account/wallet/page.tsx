import { AccountWalletPage } from "../AccountPages";

export const metadata = { title: "My wallet", robots: { index: false, follow: false } };

export default function Wallet() {
  return <AccountWalletPage />;
}
