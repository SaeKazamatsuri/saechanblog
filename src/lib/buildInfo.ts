// dev環境では現在時刻を使うようフォールバックする
export const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString()
