import Link from 'next/link'

type BreadcrumbItem = {
    name: string
    path?: string
}

type BreadcrumbsProps = {
    items: BreadcrumbItem[]
    maxWidthClass?: string
}

const Breadcrumbs = ({ items, maxWidthClass = 'max-w-[40rem]' }: BreadcrumbsProps) => {
    const secondLen = Array.from(items[1]?.name ?? '').length
    const secondWidthRem = `${secondLen * 1.2}rem`

    return (
        <nav aria-label="breadcrumb">
            <ol className="flex flex-nowrap space-r-2 text-sm text-gray-500 overflow-hidden">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1

                    const content =
                        item.path && !isLast ? (
                            <Link
                                href={item.path}
                                className="hover:text-blue-500 inline-block whitespace-nowrap break-keep"
                                title={item.name}
                            >
                                {item.name}
                            </Link>
                        ) : (
                            <span
                                className={`inline-block ${isLast ? `truncate ${maxWidthClass}` : ''} whitespace-nowrap break-keep`}
                                title={item.name}
                                aria-current={isLast ? 'page' : undefined}
                            >
                                {item.name}
                            </span>
                        )

                    const liClass =
                        index === 0
                            ? 'shrink-0 w-10'
                            : index === 1
                              ? 'shrink-0 w-[var(--cat-w)]'
                              : isLast
                                ? 'min-w-0 flex-1'
                                : 'shrink-0'

                    const liStyle =
                        index === 1 ? ({ ['--cat-w' as any]: secondWidthRem } as React.CSSProperties) : undefined

                    return (
                        <li key={index} className={`flex items-center ${liClass}`} style={liStyle}>
                            {index > 0 && <span className="mx-2 shrink-0">/</span>}
                            {content}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}

export default Breadcrumbs
