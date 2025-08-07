
import MainLayout from "@/components/layout/MainLayout";

export default function WithNavLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <MainLayout>{children}</MainLayout>;
}
