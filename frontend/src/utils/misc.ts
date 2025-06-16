export function getLabel(locale: string, options: { [key: string]: string } | undefined): string {
  if (!options || !locale) return '';
  return options[locale] || options['en'];
}

export function truncateString(str: string, num: number) {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + '...';
}