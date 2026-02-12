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
    <div className="space-y-5 p-5 bg-[#0d0d0f] border-t border-zinc-800 animate-fadeIn">
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2 block">
          Titulo
        </label>
        <input
          value={recipe.title}
          onChange={(e) => updateRecipe(index, "title", e.target.value)}
          className="w-full bg-[#18181b] border border-zinc-800 rounded-xl py-3 px-4 text-base text-zinc-200 focus:outline-none focus:border-amber-500/50"
        />
      </div>
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2 block">
          Descripcion
        </label>
        <textarea
          value={recipe.description}
          onChange={(e) => updateRecipe(index, "description", e.target.value)}
          rows={2}
          className="w-full bg-[#18181b] border border-zinc-800 rounded-xl py-3 px-4 text-base text-zinc-200 focus:outline-none focus:border-amber-500/50 resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2 block">
            Categoria
          </label>
          <select
            value={recipe.category}
            onChange={(e) =>
              updateRecipe(index, "category", e.target.value as Category)
            }
            className="w-full bg-[#18181b] border border-zinc-800 rounded-xl py-3 px-4 text-base text-zinc-200 focus:outline-none focus:border-amber-500/50"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2 block">
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
        <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2 block">
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
          className="w-full bg-[#18181b] border border-zinc-800 rounded-xl py-3 px-4 text-base text-zinc-200 focus:outline-none focus:border-amber-500/50 resize-none font-mono leading-relaxed"
        />
      </div>
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2 block">
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
          className="w-full bg-[#18181b] border border-zinc-800 rounded-xl py-3 px-4 text-base text-zinc-200 focus:outline-none focus:border-amber-500/50 resize-none font-mono leading-relaxed"
        />
      </div>
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2 block">
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
          <label className="flex items-center gap-2.5 px-5 py-3 bg-[#18181b] border border-zinc-800 rounded-xl text-base text-zinc-400 cursor-pointer hover:border-zinc-700 transition-colors">
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
        className="w-full py-3 bg-amber-500/10 text-amber-500 rounded-xl text-base font-semibold hover:bg-amber-500/20 transition-colors"
      >
        Listo
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center animate-fadeIn">
      <div className="bg-[#111113] border border-zinc-800 w-full max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col animate-slideUp sm:animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0">
          <h2 className="text-xl font-bold text-zinc-100">Nueva Receta</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-2 rounded-xl hover:bg-zinc-800/50 transition-colors"
          >
            <X size={22} />
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
                className={`flex-1 flex items-center justify-center gap-2.5 py-4 text-base font-semibold transition-colors ${
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-base animate-fadeIn">
              {error}
            </div>
          )}

          {/* Input forms (before extraction) */}
          {extractedRecipes.length === 0 && !showPageSelector && (
            <>
              {activeTab === "url" && (
                <div className="space-y-5">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://receta.com/..."
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl py-4 px-5 text-zinc-200 placeholder-zinc-600 text-base focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25"
                  />
                  <button
                    onClick={handleUrlExtract}
                    disabled={!url.trim() || processing}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Procesando...
                      </>
                    ) : (
                      <>
                        Extraer receta
                        <ChevronRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeTab === "screenshot" && (
                <div className="space-y-5">
                  {screenshotPreview ? (
                    <div className="relative rounded-2xl overflow-hidden">
                      <img
                        src={screenshotPreview}
                        alt="Screenshot"
                        className="w-full max-h-72 object-contain bg-zinc-900 rounded-2xl"
                      />
                      <button
                        onClick={() => {
                          setScreenshotFile(null);
                          setScreenshotPreview(null);
                        }}
                        className="absolute top-3 right-3 bg-black/60 p-2 rounded-xl"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition-colors">
                      <Camera className="text-zinc-600 mb-4" size={40} />
                      <p className="text-zinc-400 text-base font-medium">
                        Toca para subir foto o screenshot
                      </p>
                      <p className="text-zinc-600 text-sm mt-2">
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
                      className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Analizando imagen...
                        </>
                      ) : (
                        <>
                          Extraer receta de la imagen
                          <ChevronRight size={20} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {activeTab === "pdf" && (
                <div className="space-y-5">
                  <label className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition-colors">
                    <FileText className="text-zinc-600 mb-4" size={40} />
                    <p className="text-zinc-400 text-base font-medium">
                      Toca para subir un PDF
                    </p>
                    <p className="text-zinc-600 text-sm mt-2">
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
                    <div className="flex items-center justify-center gap-3 py-6 text-amber-500">
                      <Loader2 className="animate-spin" size={20} />
                      <span className="text-base">Procesando PDF...</span>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-base text-zinc-400 font-medium">
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
                    className="text-sm text-amber-500 font-semibold"
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
                  className="border border-zinc-800 rounded-2xl overflow-hidden"
                >
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                    onClick={() => toggleRecipe(index)}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selectedRecipes.has(index)
                          ? "bg-amber-500 border-amber-500"
                          : "border-zinc-700"
                      }`}
                    >
                      {selectedRecipes.has(index) && (
                        <Check size={14} className="text-black" />
                      )}
                    </div>
                    {previewImages[index] && (
                      <img
                        src={previewImages[index]!}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-zinc-200 truncate">
                        {recipe.title}
                      </p>
                      <p className="text-sm text-zinc-500 mt-0.5">
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
                      className="p-2.5 text-zinc-500 hover:text-amber-500 transition-colors rounded-xl hover:bg-zinc-800/50"
                    >
                      <Edit3 size={16} />
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
          <div className="p-6 border-t border-zinc-800 shrink-0 safe-bottom">
            <button
              onClick={handleSave}
              disabled={selectedRecipes.size === 0 || saving}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus size={20} />
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
