import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '運営者について',
    description: 'このサイトの運営者プロフィールと運営方針',
};

export default function AboutPage() {
    return (
        <div className="mx-auto max-w-3xl px-4 py-12">
            {/* ヒーローセクション */}
            <section className="text-center mb-16">
                <h1 className="text-4xl font-bold tracking-tight">
                    サイト運営者について
                </h1>
            </section>

            {/* プロフィールカード */}
            <section className="bg-white shadow-lg rounded-lg p-8 md:flex md:items-center">
                <div className="flex-shrink-0 mx-auto md:mx-0 md:mr-8 w-32 h-32 rounded-full overflow-hidden">
                    {/* 例：static 配下の画像 */}
                    <img
                        src="/image/kazamatsuri.png"
                        alt="運営者の写真"
                        className="object-cover w-full h-full"
                    />
                </div>

                <div>
                    <h2 className="text-2xl font-semibold">風祭小枝</h2>
                    <p className="mt-2 text-gray-700">
                        関東の大学に通っているオタクです。座学は苦手なので、手を動かして学んでいくタイプ。単位は命より重たい。
                    </p>

                    {/* SNS リンク（必要に応じて追加） */}
                    <ul className="mt-4 flex space-x-4">
                        <li>
                            <a
                                href="https://github.com/yourname"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-gray-900 transition"
                            >
                                GitHub
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://twitter.com/yourname"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-gray-900 transition"
                            >
                                X (Twitter)
                            </a>
                        </li>
                    </ul>
                </div>
            </section>

            {/* お問い合わせ CTA */}
            <section className="mt-16 text-center">
                <p className="text-gray-700">
                    質問や改善提案があれば、気軽にお問い合わせください。
                </p>
                <a
                    href="/contact"
                    className="inline-block mt-6 px-6 py-3 rounded-md bg-gray-800 text-white font-medium hover:bg-gray-700 transition"
                >
                    お問い合わせフォームへ
                </a>
            </section>
        </div>
    );
}
