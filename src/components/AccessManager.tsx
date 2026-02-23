"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Trash2,
  Shield,
  Loader2,
  Users,
  Mail,
} from "lucide-react";
import {
  getAccessConfig,
  addAllowedEmail,
  removeAllowedEmail,
  isAdmin,
  AccessConfig,
} from "@/lib/access-control";

interface AccessManagerProps {
  userEmail: string;
  onClose: () => void;
}

export function AccessManager({ userEmail, onClose }: AccessManagerProps) {
  const [config, setConfig] = useState<AccessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const [cfg, admin] = await Promise.all([
      getAccessConfig(),
      isAdmin(userEmail),
    ]);
    setConfig(cfg);
    setIsUserAdmin(admin);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const emailToAdd = newEmail.trim().toLowerCase();

    if (config?.allowedEmails.map((e) => e.toLowerCase()).includes(emailToAdd)) {
      setError("Este email ya tiene acceso");
      return;
    }

    setAdding(true);
    setError("");
    setSuccess("");

    try {
      await addAllowedEmail(emailToAdd);
      setNewEmail("");
      setSuccess(`${emailToAdd} ahora tiene acceso`);
      await loadConfig();
    } catch {
      setError("Error al agregar el email");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (email: string) => {
    if (email.toLowerCase() === config?.adminEmail.toLowerCase()) {
      setError("No puedes eliminar al administrador");
      return;
    }

    setRemoving(email);
    setError("");
    setSuccess("");

    try {
      await removeAllowedEmail(email);
      setSuccess(`${email} ya no tiene acceso`);
      await loadConfig();
    } catch {
      setError("Error al eliminar el email");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center animate-fadeIn">
      <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col animate-slideUp sm:animate-scaleIn">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
              <Users className="text-[var(--accent)]" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Acceso</h2>
              <p className="text-sm text-[var(--muted)]">Gestionar usuarios autorizados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--foreground)] p-2 rounded-xl hover:bg-[var(--card-hover)] transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[var(--accent)]" size={28} />
            </div>
          ) : !isUserAdmin ? (
            <div className="text-center py-12">
              <Shield className="text-[var(--border-light)] mx-auto mb-4" size={48} />
              <p className="text-[var(--muted)] text-base">
                Solo el administrador puede gestionar los accesos
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleAdd} className="space-y-4">
                <label className="text-sm text-[var(--muted)] font-semibold block">
                  Agregar nuevo usuario
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1 flex items-center">
                    <Mail className="absolute left-4 text-[var(--muted-dark)] pointer-events-none" size={16} />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        setError("");
                        setSuccess("");
                      }}
                      placeholder="email@ejemplo.com"
                      required
                      style={{ paddingLeft: "3rem" }}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3.5 pr-4 text-base text-[var(--foreground)] placeholder-[var(--muted-dark)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={adding || !newEmail.trim()}
                    className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white font-bold px-5 py-3.5 rounded-xl transition-colors flex items-center gap-2 shrink-0"
                  >
                    {adding ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <UserPlus size={18} />
                    )}
                  </button>
                </div>
              </form>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-fadeIn">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-[var(--sage-soft)] border border-[var(--sage)]/20 rounded-xl p-4 animate-fadeIn">
                  <p className="text-[var(--sage)] text-sm">{success}</p>
                </div>
              )}

              <div>
                <label className="text-sm text-[var(--muted)] font-semibold mb-3 block">
                  Usuarios con acceso ({config?.allowedEmails.length || 0})
                </label>
                <div className="space-y-2">
                  {config?.allowedEmails.map((email) => {
                    const isAdminEmail =
                      email.toLowerCase() === config.adminEmail.toLowerCase();
                    const isCurrentUser =
                      email.toLowerCase() === userEmail.toLowerCase();

                    return (
                      <div
                        key={email}
                        className="flex items-center justify-between bg-[var(--background)] border border-[var(--border)] rounded-xl px-5 py-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[var(--card-hover)] flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-[var(--muted)] uppercase">
                              {email[0]}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-base text-[var(--foreground)] truncate">
                              {email}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {isAdminEmail && (
                                <span className="text-xs text-[var(--accent)] font-semibold flex items-center gap-1">
                                  <Shield size={10} />
                                  Admin
                                </span>
                              )}
                              {isCurrentUser && (
                                <span className="text-xs text-[var(--muted-dark)]">
                                  (tu)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {!isAdminEmail && (
                          <button
                            onClick={() => handleRemove(email)}
                            disabled={removing === email}
                            className="p-2.5 text-[var(--muted-dark)] hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                          >
                            {removing === email ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
