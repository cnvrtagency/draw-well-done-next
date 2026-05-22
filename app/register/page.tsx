import { RegisterClient } from "./RegisterClient";

export const metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default function Register() {
  return <RegisterClient />;
}
