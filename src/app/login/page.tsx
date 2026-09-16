import type { Metadata } from "next";
import LoginWorkspace from "../components/login-workspace";

export const metadata: Metadata = { title: "Entrar | OctaReview" };

export default function LoginPage() {
  return <LoginWorkspace />;
}
