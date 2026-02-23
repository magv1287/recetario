"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Link,
  Camera,
  FileText,
  Loader2,
  Check,
  ChevronRight,
  Edit3,
  Plus,
  Image as ImageIcon,
} from "lucide-react";
import { ExtractedRecipe, Category } from "@/lib/types";
import { CATEGORIES, DIETS } from "@/lib/categories";
import { PDFPageSelector } from "./PDFPageSelector";

type ImportTab = "url" | "screenshot" | "pdf";

interface ImportModalProps {
  onClose: () => void;
  onSave: (
    recipes: ExtractedRecipe[],
    imageFiles?: (File | null)[]
  ) => Promise<void>;
}

export function ImportModal({ onClose, onSave }: ImportModalProps) {
  const [activeTab, setActiveTab] = useState<ImportTab>("url");
  const [url, setUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [extractedRecipes, setExtractedRecipes] = useState<ExtractedRecipe[]>(
    []
  );
  const [selectedRecipes, setSelectedRecipes] = useState<Set<number>>(
    new Set()
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([]);
  const [previewImages, setPreviewImages] = useState<(string | null)[]>([]);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [showPageSelector, setShowPageSelector] = useState(false);

  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const tabs: { id: ImportTab; label: string; icon: React.ReactNode }[] = [
    { id: "url", label: "URL", icon: <Link size={18} /> },
    { id: "screenshot", label: "Foto", icon: <Camera size={18} /> },
    { id: "pdf", label: "PDF", icon: <FileText size={18} /> },
  ];

  const resetState = () => {
    setExtractedRecipes([]);
    setSelectedRecipes(new Set());
    setEditingIndex(null);
    setError("");
    setImageFiles([]);
    setPreviewImages([]);
  };

  const handleUrlExtract = async () => {
    if (!url.trim()) return;
    resetState();
    setProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al procesar la URL");
      }

      const recipes: ExtractedRecipe[] = data.recipes || [];
      if (recipes.length === 0) throw new Error("No se encontraron recetas en esta URL");

      setExtractedRecipes(recipes);
      setSelectedRecipes(new Set(recipes.map((_, i) => i)));
      setImageFiles(recipes.map(() => null));
      setPreviewImages(recipes.map((r) => r.imageUrl || null));
    } catch (err: any) {
      setError(err.message || "Error al procesar la URL");
    } finally {
      setProcessing(false);
    }
  };

  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
    resetState();
  };

  const handleScreenshotExtract = async () => {
    if (!screenshotFile) return;
    setProcessing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", screenshotFile);

      const res = await fetch("/api/extract-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al procesar la imagen");

      const data = await res.json();
      const recipes: ExtractedRecipe[] = data.recipes || [];
      if (recipes.length === 0)
        throw new Error("No se encontraron recetas en la imagen");

      setExtractedRecipes(recipes);
      setSelectedRecipes(new Set(recipes.map((_, i) => i)));
      setImageFiles(
        recipes.map((_, i) => (i === 0 ? screenshotFile : null))
      );
      setPreviewImages(
        recipes.map((r, i) =>
          i === 0 ? screenshotPreview : r.imageUrl || null
        )
      );
    } catch (err: any) {
      setError(err.message || "Error al procesar la imagen");
    } finally {
      setProcessing(false);
    }
  };

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    resetState();

    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("action", "preview");

      const res = await fetch("/api/extract-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al leer el PDF");

      const data = await res.json();
      setPdfPageCount(data.totalPages || 1);

      if (data.totalPages > 3) {
        setShowPageSelector(true);
      } else {
        handlePdfExtract(file, null);
      }
    } catch (err: any) {
      setError(err.message || "Error al leer el PDF");
    }
  };

  const handlePdfExtract = async (
    file: File,
    pages: string | null
  ) => {
    setProcessing(true);
    setError("");
    setShowPageSelector(false);

    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("action", "extract");
      if (pages) formData.append("pages", pages);

      const res = await fetch("/api/extract-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al procesar el PDF");

      const data = await res.json();
      const recipes: ExtractedRecipe[] = data.recipes || [];
      if (recipes.length === 0)
        throw new Error("No se encontraron recetas en el PDF");

      setExtractedRecipes(recipes);
      setSelectedRecipes(new Set(recipes.map((_, i) => i)));
      setImageFiles(recipes.map(() => null));
      setPreviewImages(recipes.map(() => null));
    } catch (err: any) {
      setError(err.message || "Error al procesar el PDF");
    } finally {
      setProcessing(false);
    }
  };

  const updateRecipe = (index: number, field: string, value: any) => {
    setExtractedRecipes((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const handleImageUpload = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newFiles = [...imageFiles];
    newFiles[index] = file;
    setImageFiles(newFiles);
    const newPreviews = [...previewImages];
    newPreviews[index] = URL.createObjectURL(file);
    setPreviewImages(newPreviews);
  };

  const toggleRecipe = (index: number) => {
    const newSelected = new Set(selectedRecipes);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRecipes(newSelected);
  };

  const handleSave = async () => {
    const recipesToSave = extractedRecipes.filter((_, i) =>
      selectedRecipes.has(i)
    );
    const filesToSave = imageFiles.filter((_, i) => selectedRecipes.has(i));

    if (recipesToSave.length === 0) return;

    setSaving(true);
    try {
      await onSave(recipesToSave, filesToSave);
      onClose();
    } catch {
      setError("Error al guardar las recetas");
    } finally {
      setSaving(false);
    }
  };

  const renderEditForm = (recipe: ExtractedRecipe, index: number) => (
    <div className="space-y-5 p-5 bg-[var(--background)] border-t border-[var(--border)] animate-fadeIn">
      <div>
        <label className="text-xs text-[var(--muted-dark)] uppercase tracking-wider font-semibold mb-2 block">
          Titulo
        </label>
        <input
          value={recipe.title}
          onChange={(e) => updateRecipe(index, "title", e.target.value)}
          className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40"
        />
      </div>
      <div>
        <label className="text-xs text-[var(--muted-dark)] uppercase tracking-wider font-semibold mb-2 block">
          Descripcion
        </label>
        <textarea
          value={recipe.description}
          onChange={(e) => updateRecipe(index, "description", e.target.value)}
          rows={2}
          className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40 resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-[var(--muted-dark)] uppercase tracking-wider font-semibold mb-2 block">
            Categoria
          </label>
          <select
            value={recipe.category}
            onChange={(e) =>
              updateRecipe(index, "category", e.target.value as Category)
            }
            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-[var(--muted-dark)] uppercase tracking-wider font-semibold mb-2 block">
            Dietas
          </label>
          <div className="flex flex-wrap gap-2">
            {DIETS.map((diet) => (
              <button
                key={diet.name}
                type="button"
                onClick={() => {
                  const diets = recipe.diets.includes(diet.name)
                    ? recipe.diets.filter((d) => d !== diet.name)
                    : [...recipe.diets, diet.name];
                  updateRecipe(index, "diets", diets);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  recipe.diets.includes(diet.name)
                    ? diet.color
                    : "border-[var(--border)] text-[var(--muted-dark)]"
                }`}
              >
                {diet.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="text-xs text-[var(--muted-dark)] uppercase tracking-wider font-semibold mb-2 block">
          Ingredientes (uno por linea)
        </label>
        <textarea
          value={recipe.ingredients.join("\n")}
          onChange={(e) =>
            updateRecipe(
              index,
              "ingredients",
              e.target.value.split("\n").filter((s) => s.trim())
            )
          }
          rows={5}
          className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40 resize-none font-mono leading-relaxed"
        />
      </div>
      <div>
        <label className="text-xs text-[var(--muted-dark)] uppercase tracking-wider font-semibold mb-2 block">
          Pasos (uno por linea)
        </label>
        <textarea
          value={recipe.steps.join("\n")}
          onChange={(e) =>
            updateRecipe(
              index,
              "steps",
              e.target.value.split("\n").filter((s) => s.trim())
            )
          }
          rows={5}
          className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40 resize-none font-mono leading-relaxed"
        />
      </div>
      <div>
        <label className="text-xs text-[var(--muted-dark)] uppercase tracking-wider font-semibold mb-2 block">
          Imagen
        </label>
        <div className="flex items-center gap-4">
          {previewImages[index] && (
            <img
              src={previewImages[index]!}
              alt=""
              className="w-20 h-20 rounded-xl object-cover"
            />
          )}
          <label className="flex items-center gap-2.5 px-5 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl text-sm text-[var(--muted)] cursor-pointer hover:border-[var(--border-light)] transition-colors">
            <ImageIcon size={16} />
            {previewImages[index] ? "Cambiar" : "Subir imagen"}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(index, e)}
              className="hidden"
            />
          </label>
        </div>
      </div>
      <button
        onClick={() => setEditingIndex(null)}
        className="w-full py-3 bg-[var(--accent-soft)] text-[var(--accent)] rounded-xl text-sm font-semibold hover:bg-[var(--accent)]/20 transition-colors"
      >
        Listo
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center animate-fadeIn">
      <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-xl rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col animate-slideUp sm:animate-scaleIn shadow-[var(--shadow)]">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] shrink-0">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Nueva Receta</h2>
          <button
            onClick={onClose}
            className="text-[var(--muted-dark)] hover:text-[var(--muted)] p-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {extractedRecipes.length === 0 && (
          <div className="flex border-b border-[var(--border)] shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  resetState();
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                    : "text-[var(--muted-dark)] hover:text-[var(--muted)]"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-red-400 text-sm animate-fadeIn">
              {error}
            </div>
          )}

          {extractedRecipes.length === 0 && !showPageSelector && (
            <>
              {activeTab === "url" && (
                <div className="space-y-4">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://receta.com/..."
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3.5 px-4 text-[var(--foreground)] placeholder-[var(--muted-dark)] text-sm focus:outline-none focus:border-[var(--accent)]/40 focus:ring-1 focus:ring-[var(--accent)]/20"
                  />
                  <button
                    onClick={handleUrlExtract}
                    disabled={!url.trim() || processing}
                    className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Procesando...
                      </>
                    ) : (
                      <>
                        Extraer receta
                        <ChevronRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeTab === "screenshot" && (
                <div className="space-y-4">
                  {screenshotPreview ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img
                        src={screenshotPreview}
                        alt="Screenshot"
                        className="w-full max-h-72 object-contain bg-[var(--background)] rounded-xl"
                      />
                      <button
                        onClick={() => {
                          setScreenshotFile(null);
                          setScreenshotPreview(null);
                        }}
                        className="absolute top-3 right-3 bg-black/60 p-2 rounded-lg"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--border-light)] transition-colors">
                      <Camera className="text-[var(--muted-dark)] mb-3" size={36} />
                      <p className="text-[var(--muted)] text-sm font-medium">
                        Toca para subir foto o screenshot
                      </p>
                      <p className="text-[var(--muted-dark)] text-xs mt-1.5">
                        Instagram, TikTok, o cualquier imagen de receta
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleScreenshotSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                  {screenshotFile && (
                    <button
                      onClick={handleScreenshotExtract}
                      disabled={processing}
                      className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Analizando imagen...
                        </>
                      ) : (
                        <>
                          Extraer receta de la imagen
                          <ChevronRight size={18} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {activeTab === "pdf" && (
                <div className="space-y-4">
                  <label className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--border-light)] transition-colors">
                    <FileText className="text-[var(--muted-dark)] mb-3" size={36} />
                    <p className="text-[var(--muted)] text-sm font-medium">
                      Toca para subir un PDF
                    </p>
                    <p className="text-[var(--muted-dark)] text-xs mt-1.5">
                      Libro de recetas, PDF de revista, etc.
                    </p>
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfSelect}
                      className="hidden"
                    />
                  </label>
                  {processing && (
                    <div className="flex items-center justify-center gap-3 py-5 text-[var(--accent)]">
                      <Loader2 className="animate-spin" size={18} />
                      <span className="text-sm">Procesando PDF...</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {showPageSelector && pdfFile && (
            <PDFPageSelector
              totalPages={pdfPageCount}
              fileName={pdfFile.name}
              onConfirm={(pages) => handlePdfExtract(pdfFile, pages)}
              onCancel={() => {
                setShowPageSelector(false);
                setPdfFile(null);
              }}
            />
          )}

          {extractedRecipes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--muted)] font-medium">
                  {extractedRecipes.length} receta
                  {extractedRecipes.length > 1 ? "s" : ""} encontrada
                  {extractedRecipes.length > 1 ? "s" : ""}
                </p>
                {extractedRecipes.length > 1 && (
                  <button
                    onClick={() => {
                      if (selectedRecipes.size === extractedRecipes.length) {
                        setSelectedRecipes(new Set());
                      } else {
                        setSelectedRecipes(
                          new Set(extractedRecipes.map((_, i) => i))
                        );
                      }
                    }}
                    className="text-xs text-[var(--accent)] font-semibold"
                  >
                    {selectedRecipes.size === extractedRecipes.length
                      ? "Deseleccionar todas"
                      : "Seleccionar todas"}
                  </button>
                )}
              </div>

              {extractedRecipes.map((recipe, index) => (
                <div
                  key={index}
                  className="border border-[var(--border)] rounded-xl overflow-hidden"
                >
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[var(--card-hover)] transition-colors"
                    onClick={() => toggleRecipe(index)}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selectedRecipes.has(index)
                          ? "bg-[var(--accent)] border-[var(--accent)]"
                          : "border-[var(--border-light)]"
                      }`}
                    >
                      {selectedRecipes.has(index) && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>
                    {previewImages[index] && (
                      <img
                        src={previewImages[index]!}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">
                        {recipe.title}
                      </p>
                      <p className="text-xs text-[var(--muted-dark)] mt-0.5">
                        {recipe.category} · {recipe.ingredients.length}{" "}
                        ingredientes
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingIndex(
                          editingIndex === index ? null : index
                        );
                      }}
                      className="p-2 text-[var(--muted-dark)] hover:text-[var(--accent)] transition-colors rounded-lg hover:bg-[var(--card-hover)]"
                    >
                      <Edit3 size={15} />
                    </button>
                  </div>

                  {editingIndex === index && renderEditForm(recipe, index)}
                </div>
              ))}
            </div>
          )}
        </div>

        {extractedRecipes.length > 0 && (
          <div className="p-5 border-t border-[var(--border)] shrink-0 safe-bottom">
            <button
              onClick={handleSave}
              disabled={selectedRecipes.size === 0 || saving}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Guardar {selectedRecipes.size} receta
                  {selectedRecipes.size > 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
