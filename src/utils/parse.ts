export const parsePrice = (val: string) => parseInt(val.replace(/,/g, '') || '0')
export const parseFloor = (addr: string) => parseInt(addr.match(/(\d+)樓/)?.[1] ?? '0')
export const parseStreetNo = (addr: string) => addr.match(/(\d+)號/)?.[1] ?? ''
