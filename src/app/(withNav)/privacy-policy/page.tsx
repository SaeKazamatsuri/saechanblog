import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'プライバシーポリシー',
	description: 'ショートランドのこかげ(sae-chan.net)のプライバシーポリシー',
};

export default function PrivacyPolicyPage() {
	return (
		<div className="mx-auto max-w-3xl px-4 py-12">
			{ }
			<section className="text-center mb-16">
				<h1 className="text-4xl font-bold tracking-tight">プライバシーポリシー</h1>
			</section>

			{ }
			<article className="max-w-none">
				{ }
				<h2 className="scroll-mt-24 text-2xl sm:text-3xl font-bold mt-12 mb-4 pb-2 border-b-2 border-blue-200/80 text-blue-800">
					「ショートランドのこかげ(sae-chan.net)」について
				</h2>
				<p className="leading-relaxed text-slate-800 text-lg">
					ショートランドのこかげ（以下、「当サイト」と言います。）では、お客様からお預かりする個人情報の重要性を強く認識し、
					個人情報の保護に関する法律、その他の関係法令を遵守すると共に、以下に定めるプライバシーポリシーに従って、
					個人情報を安全かつ適切に取り扱うことを宣言いたします。
				</p>

				{ }
				<h2 className="scroll-mt-24 text-2xl sm:text-3xl font-bold mt-12 mb-4 pb-2 border-b-2 border-blue-200/80 text-blue-800">
					個人情報の利用目的
				</h2>
				<p className="leading-relaxed text-slate-800 text-lg">
					当サイトでは、お問い合わせや記事へのコメントの際、名前やメールアドレス等の個人情報を入力いただく場合がございます。
					取得した個人情報は、お問い合わせに対する回答や必要な情報を電子メールなどでご連絡する場合に利用させていただくものであり、
					これらの目的以外では利用いたしません。
				</p>

				{ }
				<h2 className="scroll-mt-24 text-2xl sm:text-3xl font-bold mt-12 mb-4 pb-2 border-b-2 border-blue-200/80 text-blue-800">
					個人情報の第三者提供
				</h2>
				<p className="leading-relaxed text-slate-800 text-lg">
					お客様からお預かりした個人情報を、個人情報保護法その他の法令に基づき開示が認められる場合を除き、
					ご本人様の同意を得ずに第三者に提供することはありません。
				</p>

				{ }
				<h2 className="scroll-mt-24 text-2xl sm:text-3xl font-bold mt-12 mb-4 pb-2 border-b-2 border-blue-200/80 text-blue-800">
					免責事項
				</h2>
				<p className="leading-relaxed text-slate-800 text-lg">
					当サイトからのリンクやバナーなどで移動したサイトで提供される情報、サービス等について一切の責任を負いません。
				</p>
				<p className="leading-relaxed text-slate-800 text-lg">
					また当サイトのコンテンツ・情報について、できる限り正確な情報を提供するよう努めておりますが、
					正確性や安全性を保証するものではありません。情報が古くなっていることもございます。
				</p>
				<p className="leading-relaxed text-slate-800 text-lg">
					当サイトに掲載された内容によって生じた損害等の一切の責任を負いかねますのでご了承ください。
				</p>

				{ }
				<h2 className="scroll-mt-24 text-2xl sm:text-3xl font-bold mt-12 mb-4 pb-2 border-b-2 border-blue-200/80 text-blue-800">
					著作権について
				</h2>
				<p className="leading-relaxed text-slate-800 text-lg">
					当サイトで掲載している文章や画像などにつきましては、無断転載することを禁止します。
					当サイトは著作権や肖像権の侵害を目的としたものではありません。著作権や肖像権に関して問題がございましたら、
					<a href="/contact" className="underline hover:text-blue-700">
						お問い合わせフォーム
					</a>
					よりご連絡ください。迅速に対応いたします。
				</p>

				{ }
				<h2 className="scroll-mt-24 text-2xl sm:text-3xl font-bold mt-12 mb-4 pb-2 border-b-2 border-blue-200/80 text-blue-800">
					リンクについて
				</h2>
				<p className="leading-relaxed text-slate-800 text-lg">
					当ブログは基本的にリンクフリーです。リンクを行う場合の許可や連絡は不要です。
					ただし、インラインフレームの使用や画像の直リンクはご遠慮ください。
				</p>
			</article>

			{ }
			<section className="mt-16 text-center">
				<p className="text-gray-700">
					ご不明点があれば、いつでもお問い合わせください。
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
