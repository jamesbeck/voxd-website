import LoginForm from "@/components/LoginForm";
import { verifyIdToken } from "@/lib/auth/verifyToken";

export default async function LoginPage() {
  const idToken = await verifyIdToken(false);

  return <LoginForm email={idToken?.email} />;
}
