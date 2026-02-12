"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { ChefHat, Mail, Lock, Eye, EyeOff, Loader2, Link, Camera, FileText, ShieldCheck } from "lucide-react";

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
      <div className="h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  if (user) return null;

  return (
    <main className="min-h-screen bg-[#09090b] flex">
      {/* ---- Desktop: left panel with branding ---- */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-amber-500/5 via-[#09090b] to-orange-500/5 border-r border-zinc-800/50 flex-col justify-center items-center p-16">
        <div className="max-w-lg text-center">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-amber-500/10 mb-10">
            <ChefHat className="text-amber-500" size={56} />
          </div>
          <h2 className="text-5xl font-bold text-zinc-100 mb-5 leading-tight">
            Tu recetario personal
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent"> inteligente</span>
          </h2>
          <p className="text-zinc-400 text-xl leading-relaxed mb-14">
            Guarda recetas desde cualquier lugar. La IA las organiza por ti.
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-5 text-left">
            <div className="bg-[#18181b]/80 border border-zinc-800 rounded-2xl p-5">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <Link className="text-blue-400" size={22} />
              </div>
              <p className="text-base font-semibold text-zinc-300">Desde URLs</p>
              <p className="text-sm text-zinc-600 mt-1.5">Pega un link y listo</p>
            </div>
            <div className="bg-[#18181b]/80 border border-zinc-800 rounded-2xl p-5">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                <Camera className="text-purple-400" size={22} />
              </div>
              <p className="text-base font-semibold text-zinc-300">Desde fotos</p>
              <p className="text-sm text-zinc-600 mt-1.5">Instagram, TikTok...</p>
            </div>
            <div className="bg-[#18181b]/80 border border-zinc-800 rounded-2xl p-5">
              <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                <FileText className="text-green-400" size={22} />
              </div>
              <p className="text-base font-semibold text-zinc-300">Desde PDFs</p>
              <p className="text-sm text-zinc-600 mt-1.5">Libros de cocina</p>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Right panel (or full screen on mobile): login form ---- */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Mobile logo (hidden on desktop) */}
          <div className="text-center mb-12 lg:hidden">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-amber-500/10 mb-5">
              <ChefHat className="text-amber-500" size={48} />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Recetario
            </h1>
            <p className="text-zinc-500 mt-3 text-base">
              Tu recetario personal inteligente
            </p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-10">
            <h1 className="text-3xl font-bold text-zinc-100">
              {isSignUp ? "Crear cuenta" : "Bienvenido de vuelta"}
            </h1>
            <p className="text-zinc-500 mt-2 text-base">
              {isSignUp
                ? "Crea tu cuenta para empezar a guardar recetas"
                : "Inicia sesion para ver tus recetas"}
            </p>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl px-5 py-3.5 mb-8">
            <ShieldCheck className="text-amber-500 shrink-0" size={20} />
            <p className="text-sm text-zinc-400">
              Solo usuarios autorizados pueden acceder
            </p>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-[#18181b] border border-zinc-800 rounded-2xl py-4 px-5 text-zinc-200 text-base font-medium hover:bg-[#1f1f23] transition-colors mb-8"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-600 text-sm uppercase tracking-wider font-medium">o con email</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div className="relative flex items-center">
              <Mail className="absolute left-4 text-zinc-500 pointer-events-none" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                style={{ paddingLeft: "3rem" }}
                className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl py-4 pr-5 text-base text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-colors"
              />
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-zinc-500 pointer-events-none" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contrasena"
                required
                minLength={6}
                style={{ paddingLeft: "3rem", paddingRight: "3rem" }}
                className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl py-4 text-base text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-zinc-500 p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 animate-fadeIn">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={22} />
              ) : isSignUp ? (
                "Crear cuenta"
              ) : (
                "Iniciar sesion"
              )}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-base mt-8">
            {isSignUp ? "Ya tienes cuenta?" : "No tienes cuenta?"}{" "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
              className="text-amber-500 hover:text-amber-400 font-semibold"
            >
              {isSignUp ? "Inicia sesion" : "Registrate"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
