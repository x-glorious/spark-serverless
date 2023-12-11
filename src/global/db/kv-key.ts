export const kvKey = (keys: string[] | string) =>
  (typeof keys === 'string' ? [keys] : keys).join(':')
