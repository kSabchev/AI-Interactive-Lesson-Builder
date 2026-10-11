"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlanSummary } from "@/components/billing/PlanSummary";
import { TextField } from "@/components/editor/fields";
import { Button, ButtonLink } from "@/components/ui/Button";
import { authClient } from "@/lib/auth/client";
import { useStore } from "@/lib/storage/StoreProvider";

const CONFIRM_WORD = "DELETE";

export function AccountPanel() {
  const state = useStore();
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  if (state.status === "loading") return <p className="text-muted">Loading…</p>;
  if (!state.user) {
    return (
      <div className="space-y-4">
        <p className="text-lg">You&apos;re not signed in. Lessons you save are kept in this browser only.</p>
        <ButtonLink href="/sign-in?next=/account" size="lg">
          Sign in
        </ButtonLink>
      </div>
    );
  }

  async function signOut() {
    setBusy(true);
    await authClient.signOut();
    router.push("/");
  }

  async function deleteAccount() {
    setBusy(true);
    setError(undefined);
    const { error } = await authClient.deleteUser();
    if (error) {
      setBusy(false);
      setError(error.message ?? "Couldn't delete the account. Sign out, sign in again and retry.");
      return;
    }
    router.push("/");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line">
        <h2 className="text-xl font-extrabold">Signed in</h2>
        <p className="mt-1 text-lg">{state.user.email}</p>
        <p className="mt-2 text-muted">Your lessons and quiz results are saved to your account.</p>
        <Button variant="secondary" className="mt-4" onClick={() => void signOut()} disabled={busy}>
          Sign out
        </Button>
      </section>

      <PlanSummary />

      <section aria-labelledby="delete-heading" className="rounded-3xl bg-miss-50 p-6 ring-1 ring-miss-500">
        <h2 id="delete-heading" className="text-xl font-extrabold text-miss-700">
          Delete account
        </h2>
        <p className="mt-1">
          Permanently deletes your account, every saved lesson and all quiz results, and cancels any subscription
          straight away. This can&apos;t be undone.
        </p>
        <div className="mt-4 max-w-sm space-y-3">
          <TextField label={`Type ${CONFIRM_WORD} to confirm`} value={confirm} onChange={setConfirm} error={error} />
          <Button
            className="bg-miss-500 hover:bg-miss-700"
            disabled={confirm !== CONFIRM_WORD || busy}
            onClick={() => void deleteAccount()}
          >
            Delete my account
          </Button>
        </div>
      </section>
    </div>
  );
}
