export type CatalogImageInput = {
  url: string;
  alt?: string;
  isPrimary?: boolean;
};

export function catalogImageRows(images: CatalogImageInput[]) {
  if (!images.length) return [];
  const primary = images.findIndex((image) => image.isPrimary);
  const index = primary >= 0 ? primary : 0;
  const ordered = [images[index], ...images.filter((_, i) => i !== index)];
  return ordered.map((image, sortOrder) => ({
    url: image.url,
    alt: image.alt,
    isPrimary: sortOrder === 0,
    sortOrder,
  }));
}
