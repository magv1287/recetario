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
      <div className="bg-[#111113] border border-zinc-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col animate-slideUp sm:animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Users className="text-amber-500" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Acceso</h2>
              <p className="text-sm text-zinc-500">Gestionar usuarios autorizados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-2 rounded-xl hover:bg-zinc-800/50 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-amber-500" size={28} />
            </div>
          ) : !isUserAdmin ? (
            <div className="text-center py-12">
              <Shield className="text-zinc-700 mx-auto mb-4" size={48} />
              <p className="text-zinc-400 text-base">
                Solo el administrador puede gestionar los accesos
              </p>
            </div>
          ) : (
            <>
              {/* Add new email */}
              <form onSubmit={handleAdd} className="space-y-4">
                <label className="text-sm text-zinc-400 font-semibold block">
                  Agregar nuevo usuario
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1 flex items-center">
                    <Mail className="absolute left-4 text-zinc-500 pointer-events-none" size={16} />
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
                      className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl py-3.5 pr-4 text-base text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={adding || !newEmail.trim()}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-bold px-5 py-3.5 rounded-2xl transition-colors flex items-center gap-2 shrink-0"
                  >
                    {adding ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <UserPlus size={18} />
                    )}
                  </button>
                </div>
              </form>

              {/* Messages */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 animate-fadeIn">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 animate-fadeIn">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              {/* User list */}
              <div>
                <label className="text-sm text-zinc-400 font-semibold mb-3 block">
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
                        className="flex items-center justify-between bg-[#18181b] border border-zinc-800 rounded-2xl px-5 py-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-zinc-400 uppercase">
                              {email[0]}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-base text-zinc-200 truncate">
                              {email}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {isAdminEmail && (
                                <span className="text-xs text-amber-500 font-semibold flex items-center gap-1">
                                  <Shield size={10} />
                                  Admin
                                </span>
                              )}
                              {isCurrentUser && (
                                <span className="text-xs text-zinc-500">
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
                            className="p-2.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
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
