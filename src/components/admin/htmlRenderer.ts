'use client'

// 機能: Toast UI Editor向けのHTMLレンダラー
export type HTMLToken = {
    type: 'openTag' | 'closeTag'
    tagName: string
    selfClose?: boolean
    attributes?: Record<string, string>
}

export type HTMLConvertorContext = {
    entering: boolean
    skipChildren: () => void
    getChildrenText: (node: unknown) => string
}

export type HTMLConvertor = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    node: any,
    context: HTMLConvertorContext
) => HTMLToken | HTMLToken[]

export interface HTMLConvertorMap {
    [key: string]: HTMLConvertor | undefined
}

export const makeRenderer = (slug: string): HTMLConvertorMap => {
    // 画像/リンク解決
    const isHttp = (u: string) => /^https?:\/\//i.test(u)
    const stripHead = (u: string) => u.replace(/^\.?\//, '')

    const resolveImg = (u: string) => (isHttp(u) ? u : `/api/images/${slug}/${stripHead(u)}`)
    const resolveHref = (u: string) => (isHttp(u) ? u : `/post/${slug}/${stripHead(u)}`)

    return {
        image(node: any, { skipChildren, getChildrenText }) {
            skipChildren()
            return {
                type: 'openTag',
                tagName: 'img',
                selfClose: true,
                attributes: {
                    src: resolveImg(node.destination),
                    alt: getChildrenText(node) ?? '',
                },
            }
        },
        link(node: any, { entering }) {
            const token: HTMLToken = {
                type: entering ? 'openTag' : 'closeTag',
                tagName: 'a',
            }
            if (entering) {
                token.attributes = {
                    href: resolveHref(node.destination),
                    target: '_blank',
                    rel: 'noopener noreferrer',
                }
            }
            return token
        },
    }
}
