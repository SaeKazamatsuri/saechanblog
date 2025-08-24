import Link from 'next/link'

type BreadcrumbItem = {
    name: string
    path?: string
}

type BreadcrumbsProps = {
    items: BreadcrumbItem[]
    // 1つのパンくずの最大幅をTailwindの幅クラスで調整できるようにする（例: max-w-[10rem]）
    maxWidthClass?: string
}

const Breadcrumbs = ({ items, maxWidthClass = 'max-w-[10rem]' }: BreadcrumbsProps) => {
    return (
        <nav aria-label="breadcrumb">
            {/* ol自体は横並び。overflowは子要素でtruncateするのでここでは制御しない */}
            <ol className="flex space-r-2 text-sm text-gray-500">
                {items.map((item, index) => {
                    // truncateは幅が制限されたblock/inline-block要素でのみ効くため、inline-block+max-widthを付与
                    const content = item.path ? (
                        <Link
                            href={item.path}
                            className={`hover:text-blue-500 inline-block truncate ${maxWidthClass}`}
                            title={item.name} // 省略時でもフルテキストをホバーで確認できるようにする
                        >
                            {item.name}
                        </Link>
                    ) : (
                        <span
                            className={`inline-block truncate ${maxWidthClass}`}
                            title={item.name}
                            aria-current={index === items.length - 1 ? 'page' : undefined}
                        >
                            {item.name}
                        </span>
                    )

                    return (
                        // 親にmin-w-0を付けないとflex子要素のtruncateが効かないケースがある（ブラウザ実装差異の回避）
                        <li key={index} className="flex items-center min-w-0">
                            {/* セパレーターは縮まないようにshrink-0 */}
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
