"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlanSummary } from "@/components/billing/PlanSummary";
import { TextField } from "@/components/editor/fields";
import { Button, ButtonLink } from "@/components/ui/Button";
import { authClient } from "@/lib/auth/client";
import { useT } from "@/lib/i18n/client";
import { useStore } from "@/lib/storage/StoreProvider";

export function AccountPanel() {
  const t = useT();
  const state = useStore();
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  // The confirmation word is typed in the interface language ("DELETE" / "ИЗТРИЙ").
  const confirmWord = t.account.confirmWord;

  if (state.status === "loading") return <p className="text-muted">{t.common.loading}</p>;
  if (!state.user) {
    return (
      <div className="space-y-4">
        <p className="text-lg">{t.account.notSignedIn}</p>
        <ButtonLink href="/sign-in?next=/account" size="lg">
          {t.common.signIn}
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
      setError(t.account.deleteFailed);
      return;
    }
    router.push("/");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line">
        <h2 className="text-xl font-extrabold">{t.account.signedIn}</h2>
        <p className="mt-1 text-lg">{state.user.email}</p>
        <p className="mt-2 text-muted">{t.account.savedToAccount}</p>
        <Button variant="secondary" className="mt-4" onClick={() => void signOut()} disabled={busy}>
          {t.account.signOut}
        </Button>
      </section>

      <PlanSummary />

      <section aria-labelledby="delete-heading" className="rounded-3xl bg-miss-50 p-6 ring-1 ring-miss-500">
        <h2 id="delete-heading" className="text-xl font-extrabold text-miss-700">
          {t.account.deleteTitle}
        </h2>
        <p className="mt-1">{t.account.deleteBody}</p>
        <div className="mt-4 max-w-sm space-y-3">
          <TextField label={t.account.typeToConfirm(confirmWord)} value={confirm} onChange={setConfirm} error={error} />
          <Button
            className="bg-miss-500 hover:bg-miss-700"
            disabled={confirm.trim().toUpperCase() !== confirmWord || busy}
            onClick={() => void deleteAccount()}
          >
            {t.account.deleteButton}
          </Button>
        </div>
      </section>
    </div>
  );
}
