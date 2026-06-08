"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `mutation { signup(email: "${email}", password: "${password}") { token email } }`,
      }),
    });
    const { data, errors } = await res.json();
    if (errors) return setError(errors[0].message);
    localStorage.setItem("token", data.signup.token);
    localStorage.setItem("email", data.signup.email);
    router.push("/detect");
  }

  return (
    <main style={{ maxWidth: 360, margin: "100px auto", padding: 24 }}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          />
        </div>
        {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}
        <button type="submit" style={{ width: "100%", padding: 8 }}>Sign Up</button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13 }}>
        Have an account? <Link href="/login">Login</Link>
      </p>
    </main>
  );
}
