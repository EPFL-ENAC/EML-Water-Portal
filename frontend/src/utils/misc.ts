export function getLabel(locale: string, options: { [key: string]: string }): string {
  return options[locale] || options['en'];
}

export function truncateString(str: string, num: number) {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + '...';
}