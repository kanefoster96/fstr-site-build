import Link from "next/link";
import { redirect } from "next/navigation";
import Coin from "@/components/Coin";
import { Container, Eyebrow } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { signInAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in — FSTR" };

const ERRORS: Record<string, string> = {
  empty: "Pop your email in to sign in.",
  notfound: "No account with that email yet — create one below.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  if (session.member) redirect("/me");

  return (
    <Container className="pb-16 pt-8 sm:py-16">
      <div className="mx-auto max-w-sm">
        <div className="text-center">
          <Coin size={72} className="mx-auto" />
          <div className="mt-6"><Eyebrow>Welcome back</Eyebrow></div>
          <h1 className="mt-2 font-display text-4xl font-bold">Sign in</h1>
          <p className="mx-auto mt-2 max-w-xs text-steel">
            No password — your email is your key. Enter the one you joined with.
          </p>
        </div>

        {sp.error && (
          <p className="mt-6 rounded-lg bg-mist px-4 py-3 text-center text-sm text-ink">
            {ERRORS[sp.error] ?? "Something went wrong — try again."}
          </p>
        )}

        <form action={signInAction} className="mt-6 space-y-4 rounded-3xl border border-steel/20 bg-paper p-6 sm:p-8">
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="danny@example.com"
              className="mt-1 w-full rounded-lg border border-steel/40 bg-paper px-3 py-2.5 text-sm outline-none focus:border-brass"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-paper"
          >
            Sign in
          </button>
          <p className="num text-center text-[11px] text-steel">
            Mock sign-in — we just match your email, no real auth yet.
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-steel">
          New here?{" "}
          <Link href="/join" className="value underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>
    </Container>
  );
}
