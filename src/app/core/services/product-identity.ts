export function productIdentity(id: string, name: string): string {
  if (id.startsWith('product:')) return id;
  return `product:${encodeURIComponent(id || name)}:${encodeURIComponent(name)}`;
}
