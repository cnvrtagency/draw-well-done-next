import { ResetPasswordClient } from "./ResetPasswordClient";

export const metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export default function ResetPassword() {
  return <ResetPasswordClient />;
}
