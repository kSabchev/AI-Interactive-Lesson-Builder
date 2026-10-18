"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { TextField } from "@/components/editor/fields";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth/client";
import { DEMO_CODE_HEADER } from "@/lib/auth/demo";
import { useT } from "@/lib/i18n/client";
import { useStore } from "@/lib/storage/StoreProvider";

/** Only same-site paths, so a crafted link can't send people elsewhere after signing in. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

/** Demo sign-in, when the server offers it: a throwaway account, with an access code if any are configured. */
function DemoSignIn({ needsCode, next }: { needsCode: boolean; next: string }) {
  const t = useT();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [state, setState] = useState<{ status: "idle" | "starting" } | { status: "error"; message: string }>({
    status: "idle",
  });

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (needsCode && !code.trim()) {
      setState({ status: "error", message: t.signIn.invalidCode });
      return;
    }
    setState({ status: "starting" });
    const { error } = await authClient.signIn.anonymous({
      fetchOptions: { headers: needsCode ? { [DEMO_CODE_HEADER]: code.trim() } : {} },
    });
    if (error) {
      const message =
        error.status === 403
          ? t.signIn.invalidCode
          : error.status === 429
            ? t.signIn.tooManyTries
            : t.signIn.demoFailed;
      setState({ status: "error", message });
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <section aria-labelledby="demo-heading" className="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line">
      <h2 id="demo-heading" className="text-xl font-extrabold">
        {t.signIn.demoTitle}
      </h2>
      <p className="mt-1 text-muted">{needsCode ? t.signIn.demoIntroCode : t.signIn.demoIntroOpen}</p>
      <form onSubmit={start} noValidate className="mt-4 space-y-4">
        {needsCode ? (
          <TextField
            label={t.signIn.accessCode}
            hint={t.signIn.accessCodeHint}
            value={code}
            error={state.status === "error" ? state.message : undefined}
            onChange={setCode}
          />
        ) : (
          state.status === "error" && (
            <p role="alert" className="font-bold text-miss-700">
              {state.message}
            </p>
          )
        )}
        <Button type="submit" variant="secondary" size="lg" disabled={state.status === "starting"}>
          {state.status === "starting" ? t.signIn.startingDemo : t.signIn.startDemo}
        </Button>
      </form>
      <p className="mt-3 text-sm text-muted">{t.signIn.demoKeepNote}</p>
    </section>
  );
}

export function SignInForm({
  emailEnabled = true,
  googleEnabled,
  devMailbox = false,
  demo,
}: {
  /** False when email sign-in is switched off (`EMAIL_SIGN_IN=false`), e.g. before an email domain is set up. */
  emailEnabled?: boolean;
  googleEnabled: boolean;
  devMailbox?: boolean;
  /** Present when demo sign-in is on. */
  demo?: { needsCode: boolean };
}) {
  const t = useT();
  const store = useStore();
  const usingDemo = store.status === "ready" && Boolean(store.user?.isDemo);
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
      {usingDemo && (
        <p role="status" className="rounded-2xl bg-sun-100 p-4 font-semibold">
          {t.signIn.usingDemo}
        </p>
      )}
      {linkError && (
        <p role="alert" className="rounded-2xl bg-miss-50 p-4 font-bold text-miss-700">
          {t.signIn.linkExpired}
        </p>
      )}
      {!emailEnabled && !googleEnabled && !demo && (
        <p role="status" className="rounded-2xl bg-sun-100 p-4 font-semibold">
          {t.signIn.noMethods}
        </p>
      )}
      {emailEnabled && (
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
      )}
      {googleEnabled && (
        <>
          {emailEnabled && <p className="text-center text-sm font-bold text-muted">{t.signIn.or}</p>}
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
      {demo && !usingDemo && <DemoSignIn needsCode={demo.needsCode} next={next} />}
    </div>
  );
}
