
import path from 'path';
import fs from 'fs';
import Link from 'next/link';


type Category = {

	displayName: string;

	slug: string;
};


const getCategories = (): Category[] => {
	const postsDirectory = path.join(process.cwd(), 'public/post');

	return fs
		.readdirSync(postsDirectory, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => {

			const m = dirent.name.match(/^\[(.+?)\]\((.+?)\)$/);
			if (!m) {

				return { displayName: dirent.name, slug: encodeURIComponent(dirent.name) };
			}
			const [, displayName, slug] = m;
			return { displayName, slug };
		});
};

export default function Header() {
	const categories = getCategories();

	return (
		<header className="relative z-10 bg-gray-800 text-white px-4 py-6">
			{ }
			<h1 className="text-center text-4xl font-bold tracking-wide pb-2">
				<Link href="/">ショートランドのこかげ</Link>
			</h1>

			{ }
			<nav className="mt-4">
				<ul className="flex justify-center space-x-8 text-base">
					{ }
					<li>
						<Link href="/" className="px-4 py-3 hover:text-gray-300">
							ホーム
						</Link>
					</li>

					{ }
					<li className="relative group">
						{ }
						<Link
							href="/post"
							className="cursor-pointer px-4 py-3 hover:text-gray-300"
						>
							カテゴリ ▾
						</Link>

						<ul
							className="absolute left-0 top-full hidden min-w-max bg-gray-800 shadow-lg z-20
                         group-hover:block hover:block space-y-1"
						>
							{categories.map((cat) => (
								<li key={cat.slug}>
									<Link
										href={`/post/${encodeURIComponent(cat.slug)}`}
										className="block whitespace-nowrap px-6 py-3 text-base hover:bg-gray-700"
									>
										{cat.displayName}
									</Link>
								</li>
							))}
						</ul>
					</li>

					{ }
					<li className="relative group">
						<Link
							href="/about"
							className="cursor-pointer px-4 py-3 hover:text-gray-300"
						>
							サイトについて ▾
						</Link>
						<ul
							className="absolute left-0 top-full hidden min-w-max bg-gray-800 shadow-lg z-20
                         group-hover:block hover:block space-y-1"
						>
							{[
								{ label: 'サイト運営について', href: '/charge-of-this-site' },
								{ label: 'サイトマップ', href: '/sitemap' },
								{ label: 'プライバシーポリシー', href: '/privacy-policy' },
							].map((link) => (
								<li key={link.label}>
									<Link
										href={link.href}
										className="block whitespace-nowrap px-6 py-3 text-base hover:bg-gray-700"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</li>

					{ }
					<li>
						<Link href="/contact" className="px-4 py-3 hover:text-gray-300">
							お問い合わせ
						</Link>
					</li>
				</ul>
			</nav>
		</header>
	);
}
