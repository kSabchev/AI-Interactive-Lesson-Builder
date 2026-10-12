"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { TextField } from "@/components/editor/fields";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth/client";

/** Only same-site paths, so a crafted link can't send people elsewhere after signing in. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function SignInForm({ googleEnabled, devMailbox = false }: { googleEnabled: boolean; devMailbox?: boolean }) {
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
      setState({ status: "error", message: "Enter a valid email address." });
      return;
    }
    setState({ status: "sending" });
    const { error } = await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL: next,
      errorCallbackURL: `/sign-in?error=link&next=${encodeURIComponent(next)}`,
    });
    setState(error ? { status: "error", message: error.message ?? "Couldn't send the link. Please try again." } : { status: "sent" });
  }

  if (state.status === "sent") {
    return (
      <div role="status" className="rounded-3xl bg-good-50 p-6 ring-2 ring-good-500">
        <h2 className="text-xl font-extrabold text-good-700">Check your email</h2>
        <p className="mt-2">
          We sent a sign-in link to <strong>{email.trim()}</strong>. It works once and expires in 15 minutes.
        </p>
        {devMailbox && (
          <p className="mt-3 rounded-2xl bg-surface p-3 text-sm ring-1 ring-line">
            <strong>Development:</strong> emails aren&apos;t really sent.{" "}
            <Link href="/dev/mailbox" className="font-bold text-brand-700 underline underline-offset-2">
              Open the development mailbox
            </Link>{" "}
            to use the link.
          </p>
        )}
        <Button variant="ghost" className="mt-3" onClick={() => setState({ status: "idle" })}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {linkError && (
        <p role="alert" className="rounded-2xl bg-miss-50 p-4 font-bold text-miss-700">
          That sign-in link has expired or was already used. Request a new one below.
        </p>
      )}
      <form onSubmit={sendLink} noValidate className="space-y-4">
        <TextField
          label="Email"
          hint="We'll email you a link to sign in. No password needed."
          value={email}
          error={state.status === "error" ? state.message : undefined}
          onChange={setEmail}
        />
        <Button type="submit" size="lg" disabled={state.status === "sending"}>
          {state.status === "sending" ? "Sending…" : "Email me a sign-in link"}
        </Button>
      </form>
      {googleEnabled && (
        <>
          <p className="text-center text-sm font-bold text-muted">or</p>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => void authClient.signIn.social({ provider: "google", callbackURL: next })}
          >
            Continue with Google
          </Button>
        </>
      )}
    </div>
  );
}
