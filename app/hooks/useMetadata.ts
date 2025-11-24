"use client";

import { useEffect } from "react";

export function useMetadata(title: string, description?: string) {
  useEffect(() => {
    // Обновляем title
    document.title = title;

    // Обновляем meta description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      
      if (!metaDescription) {
        metaDescription = document.createElement("meta");
        metaDescription.setAttribute("name", "description");
        document.head.appendChild(metaDescription);
      }
      
      metaDescription.setAttribute("content", description);
    }

    // Обновляем Open Graph
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", title);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription && description) {
      ogDescription.setAttribute("content", description);
    }
  }, [title, description]);
}

