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

  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [showPageSelector, setShowPageSelector] = useState(false);

  // Screenshot state
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const tabs: { id: ImportTab; label: string; icon: React.ReactNode }[] = [
    { id: "url", label: "URL", icon: <Link size={16} /> },
    { id: "screenshot", label: "Foto", icon: <Camera size={16} /> },
    { id: "pdf", label: "PDF", icon: <FileText size={16} /> },
  ];

  const resetState = () => {
    setExtractedRecipes([]);
    setSelectedRecipes(new Set());
    setEditingIndex(null);
    setError("");
    setImageFiles([]);
    setPreviewImages([]);
  };

  // ----- URL extraction -----
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

  // ----- Screenshot extraction -----
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
      // Use the screenshot as image for the first recipe
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

  // ----- PDF extraction -----
  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    resetState();

    // Get page count
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
        // Small PDF, process all pages directly
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

  // ----- Recipe editing -----
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

  // ----- Save -----
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

  // ----- Render helpers -----
  const renderEditForm = (recipe: ExtractedRecipe, index: number) => (
    <div className="space-y-4 p-4 bg-[#111113] rounded-xl border border-zinc-800 animate-fadeIn">
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
          Título
        </label>
        <input
          value={recipe.title}
          onChange={(e) => updateRecipe(index, "title", e.target.value)}
          className="w-full bg-[#18181b] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50"
        />
      </div>
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
          Descripción
        </label>
        <textarea
          value={recipe.description}
          onChange={(e) => updateRecipe(index, "description", e.target.value)}
          rows={2}
          className="w-full bg-[#18181b] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50 resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
            Categoría
          </label>
          <select
            value={recipe.category}
            onChange={(e) =>
              updateRecipe(index, "category", e.target.value as Category)
            }
            className="w-full bg-[#18181b] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
            Dietas
          </label>
          <div className="flex flex-wrap gap-1">
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
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                  recipe.diets.includes(diet.name)
                    ? diet.color
                    : "border-zinc-800 text-zinc-600"
                }`}
              >
                {diet.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
          Ingredientes (uno por línea)
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
          rows={4}
          className="w-full bg-[#18181b] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50 resize-none font-mono"
        />
      </div>
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
          Pasos (uno por línea)
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
          rows={4}
          className="w-full bg-[#18181b] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50 resize-none font-mono"
        />
      </div>
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
          Imagen
        </label>
        <div className="flex items-center gap-3">
          {previewImages[index] && (
            <img
              src={previewImages[index]!}
              alt=""
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <label className="flex items-center gap-2 px-3 py-2 bg-[#18181b] border border-zinc-800 rounded-lg text-sm text-zinc-400 cursor-pointer hover:border-zinc-700 transition-colors">
            <ImageIcon size={14} />
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
        className="w-full py-2 bg-amber-500/10 text-amber-500 rounded-lg text-sm font-medium hover:bg-amber-500/20 transition-colors"
      >
        Listo
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center animate-fadeIn">
      <div className="bg-[#111113] border border-zinc-800 w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col animate-slideUp sm:animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 shrink-0">
          <h2 className="text-lg font-bold text-zinc-100">Nueva Receta</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        {extractedRecipes.length === 0 && (
          <div className="flex border-b border-zinc-800 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  resetState();
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-amber-500 border-b-2 border-amber-500"
                    : "text-zinc-500 hover:text-zinc-400"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm animate-fadeIn">
              {error}
            </div>
          )}

          {/* Input forms (before extraction) */}
          {extractedRecipes.length === 0 && !showPageSelector && (
            <>
              {activeTab === "url" && (
                <div className="space-y-4">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://receta.com/..."
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-xl py-3.5 px-4 text-zinc-200 placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25"
                  />
                  <button
                    onClick={handleUrlExtract}
                    disabled={!url.trim() || processing}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
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
                        className="w-full max-h-64 object-contain bg-zinc-900 rounded-xl"
                      />
                      <button
                        onClick={() => {
                          setScreenshotFile(null);
                          setScreenshotPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
                      <Camera className="text-zinc-600 mb-3" size={32} />
                      <p className="text-zinc-400 text-sm font-medium">
                        Toca para subir foto o screenshot
                      </p>
                      <p className="text-zinc-600 text-xs mt-1">
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
                      className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
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
                  <label className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
                    <FileText className="text-zinc-600 mb-3" size={32} />
                    <p className="text-zinc-400 text-sm font-medium">
                      Toca para subir un PDF
                    </p>
                    <p className="text-zinc-600 text-xs mt-1">
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
                    <div className="flex items-center justify-center gap-2 py-4 text-amber-500">
                      <Loader2 className="animate-spin" size={18} />
                      <span className="text-sm">Procesando PDF...</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* PDF Page Selector */}
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

          {/* Extracted Recipes */}
          {extractedRecipes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">
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
                    className="text-xs text-amber-500"
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
                  className="border border-zinc-800 rounded-xl overflow-hidden"
                >
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                    onClick={() => toggleRecipe(index)}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selectedRecipes.has(index)
                          ? "bg-amber-500 border-amber-500"
                          : "border-zinc-700"
                      }`}
                    >
                      {selectedRecipes.has(index) && (
                        <Check size={12} className="text-black" />
                      )}
                    </div>
                    {previewImages[index] && (
                      <img
                        src={previewImages[index]!}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {recipe.title}
                      </p>
                      <p className="text-xs text-zinc-500">
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
                      className="p-1.5 text-zinc-500 hover:text-amber-500 transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>

                  {editingIndex === index && renderEditForm(recipe, index)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - save button */}
        {extractedRecipes.length > 0 && (
          <div className="p-5 border-t border-zinc-800 shrink-0 safe-bottom">
            <button
              onClick={handleSave}
              disabled={selectedRecipes.size === 0 || saving}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
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
