const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

interface PexelsPhoto {
  src: {
    medium: string;
    landscape: string;
    large: string;
  };
}

export async function searchFoodImage(query: string): Promise<string> {
  if (!PEXELS_API_KEY) {
    return "";
  }

  try {
    const searchQuery = encodeURIComponent(`${query} food dish`);
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${searchQuery}&per_page=3&orientation=landscape`,
      {
        headers: { Authorization: PEXELS_API_KEY },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) return "";

    const data = await res.json();
    const photos: PexelsPhoto[] = data.photos || [];

    if (photos.length === 0) return "";

    const idx = Math.floor(Math.random() * Math.min(photos.length, 3));
    return photos[idx].src.medium || photos[idx].src.landscape || "";
  } catch {
    return "";
  }
}

export async function searchFoodImages(
  recipes: { title: string; category?: string }[]
): Promise<string[]> {
  if (!PEXELS_API_KEY) {
    return recipes.map(() => "");
  }

  const results = await Promise.allSettled(
    recipes.map((r) => {
      const term = simplifyForSearch(r.title, r.category);
      return searchFoodImage(term);
    })
  );

  return results.map((r) => (r.status === "fulfilled" ? r.value : ""));
}

function simplifyForSearch(title: string, category?: string): string {
  const cleaned = title
    .replace(/estilo\s+\w+/gi, "")
    .replace(/a la\s+\w+/gi, "")
    .replace(/con\s+/gi, "")
    .replace(/de\s+/gi, "")
    .replace(/del\s+/gi, "")
    .replace(/al\s+/gi, "")
    .replace(/en\s+/gi, "")
    .trim();

  const mainWords = cleaned.split(/\s+/).slice(0, 3).join(" ");

  if (category === "Desayunos") return `${mainWords} breakfast`;
  if (category === "Sopas") return `${mainWords} soup`;
  if (category === "Ensaladas") return `${mainWords} salad`;
  if (category === "Pescados") return `${mainWords} fish`;

  return mainWords;
}
