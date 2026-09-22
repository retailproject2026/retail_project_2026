export function productIdentity(id: string, name: string): string {
  if (id.startsWith('product:')) return id;
  return `product:${encodeURIComponent(id || name)}:${encodeURIComponent(name)}`;
}

export function productDatabaseId(id: string): string {
  if (!id.startsWith('product:')) return id;
  return decodeURIComponent(id.slice('product:'.length).split(':')[0]);
}
