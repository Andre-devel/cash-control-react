export function userInitials(name: string | undefined): string {
  if (!name) return 'CC'
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
