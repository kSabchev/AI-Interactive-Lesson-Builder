import type { Metadata } from "next";
import { AccountPanel } from "@/components/account/AccountPanel";
import { AppHeader } from "@/components/account/AppHeader";

export const metadata: Metadata = { title: "Account — Lesson Builder" };

export default function AccountPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <h1 className="mb-8 text-4xl font-extrabold">Account</h1>
        <AccountPanel />
      </main>
    </>
  );
}
