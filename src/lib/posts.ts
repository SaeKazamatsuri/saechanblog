import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'public/post');

export type PostData = {
  id: string;
  title: string;
  date: string;
  /** 表示用（日本語） */
  category: string;
  /** URL 用（英数字） */
  categorySlug: string;
  content?: string;
};

export function getSortedPostsData(): PostData[] {
  const dirNames = fs.readdirSync(postsDirectory);
  let allPosts: PostData[] = [];

  dirNames.forEach((dirName) => {
    // フォルダ名: [日本語](slug)
    const m = dirName.match(/^\[(.+?)\]\((.+?)\)$/);
    if (!m) return;
    const [, displayName, slug] = m;

    const categoryDir = path.join(postsDirectory, dirName);
    if (!fs.statSync(categoryDir).isDirectory()) return;

    const posts = fs
      .readdirSync(categoryDir)
      .filter((n) => n.endsWith('.md'))
      .map((fileName) => {
        const id = fileName.replace(/\.md$/, '');
        const fullPath = path.join(categoryDir, fileName);
        const { data } = matter(fs.readFileSync(fullPath, 'utf8'));

        return {
          id,
          category: displayName,
          categorySlug: slug,
          ...(data as { title: string; date: string }),
        } as PostData;
      });

    allPosts = allPosts.concat(posts);
  });

  return allPosts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostData(categorySlug: string, id: string) {
  // スラッグから該当ディレクトリを探す
  const dirName = fs
    .readdirSync(postsDirectory)
    .find((d) => d.match(/^\[.+?\]\((.+?)\)$/)?.[1] === categorySlug);

  if (!dirName) throw new Error(`category slug "${categorySlug}" not found`);

  const fullPath = path.join(postsDirectory, dirName, `${id}.md`);
  const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));

  // 日本語名はフォルダ名から再取得
  const displayName = dirName.match(/^\[(.+?)\]\(/)![1];

  return {
    id,
    content,
    category: displayName,
    categorySlug,
    ...(data as { title: string; date: string }),
  } as PostData;
}

/**
 * カテゴリスラッグから実際のディレクトリ名を取得
 */
export function getCategoryDirName(categorySlug: string): string | null {
  try {
    const dirNames = fs.readdirSync(postsDirectory);
    return dirNames.find((d) => d.match(/^\[.+?\]\((.+?)\)$/)?.[1] === categorySlug) || null;
  } catch {
    return null;
  }
}

/**
 * 画像パスを解決する
 */
export function resolveImagePath(categorySlug: string, imageName: string): string {
  return `/post/${categorySlug}/${imageName}`;
}