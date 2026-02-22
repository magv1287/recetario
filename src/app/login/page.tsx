"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { ChefHat, Mail, Lock, Eye, EyeOff, Loader2, CalendarDays, ShoppingCart, Sparkles, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } =
    useAuthContext();
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      const code = err?.code || "";
      const msg = err?.message || "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Email o contrasena incorrectos");
      } else if (code === "auth/email-already-in-use") {
        setError("Este email ya esta registrado");
      } else if (code === "auth/weak-password") {
        setError("La contrasena debe tener al menos 6 caracteres");
      } else if (code === "auth/invalid-email") {
        setError("Email invalido");
      } else if (msg.includes("no autorizado") || msg.includes("not authorized")) {
        setError(msg);
      } else {
        setError("Error al iniciar sesion. Intenta de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        const msg = err?.message || "";
        if (msg.includes("no autorizado") || msg.includes("not authorized")) {
          setError(msg);
        } else {
          setError("Error al iniciar con Google");
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--accent)]" size={48} />
      </div>
    );
  }

  if (user) return null;

  return (
    <main className="min-h-screen bg-[var(--background)] flex">
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-[var(--accent-soft)] via-[var(--background)] to-[var(--sage-soft)] border-r border-[var(--border)] flex-col justify-center items-center p-16">
        <div className="max-w-lg text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-[var(--accent-soft)] mb-8">
            <ChefHat className="text-[var(--accent)]" size={48} />
          </div>
          <h2 className="text-4xl font-bold text-[var(--foreground)] mb-4 leading-tight">
            Planifica tus comidas,
            <br />
            <span className="text-[var(--accent)]">simplifica tu semana</span>
          </h2>
          <p className="text-[var(--muted)] text-lg leading-relaxed mb-12">
            Calendario semanal con recetas saludables generadas por IA. Lista de compras automatica en Bring!
          </p>

          <div className="grid grid-cols-3 gap-4 text-left">
            <div className="bg-[var(--card)]/80 border border-[var(--border)] rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center mb-3">
                <CalendarDays className="text-[var(--accent)]" size={20} />
              </div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Planificador</p>
              <p className="text-xs text-[var(--muted-dark)] mt-1">Desayuno, almuerzo y cena</p>
            </div>
            <div className="bg-[var(--card)]/80 border border-[var(--border)] rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--sage-soft)] flex items-center justify-center mb-3">
                <Sparkles className="text-[var(--sage)]" size={20} />
              </div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Recetas IA</p>
              <p className="text-xs text-[var(--muted-dark)] mt-1">Alta proteina, low carb</p>
            </div>
            <div className="bg-[var(--card)]/80 border border-[var(--border)] rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                <ShoppingCart className="text-purple-400" size={20} />
              </div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Lista automatica</p>
              <p className="text-xs text-[var(--muted-dark)] mt-1">Sync con Bring!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md animate-fadeIn">
          <div className="text-center mb-10 lg:hidden">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--accent-soft)] mb-4">
              <ChefHat className="text-[var(--accent)]" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              Recetario
            </h1>
            <p className="text-[var(--muted-dark)] mt-2 text-sm">
              Planificador de comidas semanal
            </p>
          </div>

          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {isSignUp ? "Crear cuenta" : "Bienvenido de vuelta"}
            </h1>
            <p className="text-[var(--muted-dark)] mt-1.5 text-sm">
              {isSignUp
                ? "Crea tu cuenta para empezar a planificar"
                : "Inicia sesion para ver tu planificacion"}
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-[var(--accent-soft)] border border-[var(--accent)]/15 rounded-xl px-4 py-3 mb-6">
            <ShieldCheck className="text-[var(--accent)] shrink-0" size={18} />
            <p className="text-xs text-[var(--muted)]">
              Solo usuarios autorizados pueden acceder
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-[var(--card)] border border-[var(--border)] rounded-xl py-3.5 px-5 text-[var(--foreground)] text-sm font-medium hover:bg-[var(--card-hover)] transition-colors mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[var(--muted-dark)] text-xs uppercase tracking-wider font-medium">o con email</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 text-[var(--muted-dark)] pointer-events-none" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                style={{ paddingLeft: "2.75rem" }}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-3.5 pr-4 text-sm text-[var(--foreground)] placeholder-[var(--muted-dark)] focus:outline-none focus:border-[var(--accent)]/40 transition-colors"
              />
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 text-[var(--muted-dark)] pointer-events-none" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contrasena"
                required
                minLength={6}
                style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-3.5 text-sm text-[var(--foreground)] placeholder-[var(--muted-dark)] focus:outline-none focus:border-[var(--accent)]/40 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-[var(--muted-dark)] p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3.5 animate-fadeIn">
                <p className="text-red-400 text-xs text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-black font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : isSignUp ? (
                "Crear cuenta"
              ) : (
                "Iniciar sesion"
              )}
            </button>
          </form>

          <p className="text-center text-[var(--muted-dark)] text-sm mt-6">
            {isSignUp ? "Ya tienes cuenta?" : "No tienes cuenta?"}{" "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
              className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-semibold"
            >
              {isSignUp ? "Inicia sesion" : "Registrate"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
