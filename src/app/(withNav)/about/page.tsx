// app/about/page.tsx

import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'サイトについて',
    description: 'このサイトの目的と内容についての説明',
};

export default function AboutPage() {
    return (
        <div className="mx-auto max-w-3xl px-4 py-12">
            {/* ヒーローセクション */}
            <section className="text-center mb-16">
                <h1 className="text-4xl font-bold tracking-tight">
                    サイトについて
                </h1>
            </section>

            {/* コンテンツ本文 */}
            <section className="text-lg text-gray-800 leading-relaxed mb-16">
                <p>
                    当サイトは風祭小枝の活動を記録するブログとなっております。不定期に更新しますので、気長にお待ちください。
                </p>
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
