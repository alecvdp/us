import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

async function login(formData: FormData) {
  "use server";

  const password = formData.get("password")?.toString();
  const expected = process.env.AUTH_PASSWORD;

  if (!expected || password !== expected) {
    redirect("/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set("us-session", "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Us</h1>
        <p className={styles.subtitle}>Enter the password to continue</p>

        <form action={login} className={styles.form}>
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="input-base"
            autoFocus
            required
          />
          {params.error && (
            <p className={styles.error}>Wrong password, try again.</p>
          )}
          <button type="submit" className="btn-primary">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
