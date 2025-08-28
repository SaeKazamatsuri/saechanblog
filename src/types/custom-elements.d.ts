import type * as React from 'react'

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'link-card': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                href: string
            }
        }
    }
}
