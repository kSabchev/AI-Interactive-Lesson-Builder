"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { TextField } from "@/components/editor/fields";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth/client";
import { useT } from "@/lib/i18n/client";

/** Only same-site paths, so a crafted link can't send people elsewhere after signing in. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function SignInForm({ googleEnabled, devMailbox = false }: { googleEnabled: boolean; devMailbox?: boolean }) {
  const t = useT();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const linkError = params.get("error");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ status: "idle" | "sending" | "sent" } | { status: "error"; message: string }>({
    status: "idle",
  });

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setState({ status: "error", message: t.signIn.invalidEmail });
      return;
    }
    setState({ status: "sending" });
    const { error } = await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL: next,
      errorCallbackURL: `/sign-in?error=link&next=${encodeURIComponent(next)}`,
    });
    setState(error ? { status: "error", message: t.signIn.sendFailed } : { status: "sent" });
  }

  if (state.status === "sent") {
    return (
      <div role="status" className="rounded-3xl bg-good-50 p-6 ring-2 ring-good-500">
        <h2 className="text-xl font-extrabold text-good-700">{t.signIn.checkEmail}</h2>
        <p className="mt-2">
          {t.signIn.sentTo} <strong>{email.trim()}</strong>
          {t.signIn.sentToEnd}
        </p>
        {devMailbox && (
          <p className="mt-3 rounded-2xl bg-surface p-3 text-sm ring-1 ring-line">
            <strong>{t.signIn.devMailboxPrefix}</strong> {t.signIn.devMailboxText}{" "}
            <Link href="/dev/mailbox" className="font-bold text-brand-700 underline underline-offset-2">
              {t.signIn.devMailboxLink}
            </Link>
            {t.signIn.devMailboxEnd}
          </p>
        )}
        <Button variant="ghost" className="mt-3" onClick={() => setState({ status: "idle" })}>
          {t.signIn.differentEmail}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {linkError && (
        <p role="alert" className="rounded-2xl bg-miss-50 p-4 font-bold text-miss-700">
          {t.signIn.linkExpired}
        </p>
      )}
      <form onSubmit={sendLink} noValidate className="space-y-4">
        <TextField
          label={t.signIn.email}
          hint={t.signIn.emailHint}
          value={email}
          error={state.status === "error" ? state.message : undefined}
          onChange={setEmail}
        />
        <Button type="submit" size="lg" disabled={state.status === "sending"}>
          {state.status === "sending" ? t.signIn.sending : t.signIn.sendLink}
        </Button>
      </form>
      {googleEnabled && (
        <>
          <p className="text-center text-sm font-bold text-muted">{t.signIn.or}</p>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => void authClient.signIn.social({ provider: "google", callbackURL: next })}
          >
            {t.signIn.google}
          </Button>
        </>
      )}
    </div>
  );
}
