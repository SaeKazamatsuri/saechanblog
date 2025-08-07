'use client'

import { useEffect, useRef, useState } from 'react'

export type Heading = {
	id: string
	text: string
	level: 2 | 3
}

type Props = { headings: Heading[] }

export default function TableOfContents({ headings }: Props) {

	const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? '')
	const prevActiveRef = useRef(activeId)


	useEffect(() => {
		if (!headings.length) return

		const handleIntersect: IntersectionObserverCallback = (entries) => {

			const inView = entries
				.filter((e) => e.isIntersecting)
				.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)


			let next = prevActiveRef.current


			const atTop = window.scrollY === 0
			const atBottom =
				Math.ceil(window.innerHeight + window.scrollY) >=
				document.documentElement.scrollHeight

			if (atBottom) next = headings[headings.length - 1].id
			else if (atTop) next = headings[0].id

			else if (inView.length) next = inView[0].target.id


			if (next !== prevActiveRef.current) {
				prevActiveRef.current = next
				setActiveId(next)
			}
		}

		const observer = new IntersectionObserver(handleIntersect, {
			rootMargin: '0px 0px -70% 0px',
			threshold: 0,
		})

		const els: HTMLElement[] = []
		headings.forEach(({ id }) => {
			const el = document.getElementById(id)
			if (el) {
				observer.observe(el)
				els.push(el)
			}
		})

		return () => {
			els.forEach((el) => observer.unobserve(el))
			observer.disconnect()
		}
	}, [headings])


	useEffect(() => {
		if (!headings.length) return

		const handleScroll = () => {
			const atTop = window.scrollY === 0
			const atBottom =
				Math.ceil(window.innerHeight + window.scrollY) >=
				document.documentElement.scrollHeight

			let next: string | null = null
			if (atBottom) next = headings[headings.length - 1].id
			else if (atTop) next = headings[0].id

			if (next && next !== prevActiveRef.current) {
				prevActiveRef.current = next
				setActiveId(next)
			}
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [headings])


	const handleClick =
		(id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
			e.preventDefault()
			const el = document.getElementById(id)
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'start' })
				prevActiveRef.current = id
				setActiveId(id)
			}
		}

	return (
		<nav
			aria-label="Table of contents"
			className="bg-white p-6 rounded-xl shadow-sm"
		>
			<p className="mb-2 font-semibold text-2xl text-blue-800">もくじ</p>
			<ul className="space-y-1">
				{headings.map((h) => (
					<li key={h.id} className={h.level === 3 ? 'pl-4' : ''}>
						<a
							href={`#${h.id}`}
							onClick={handleClick(h.id)}
							className={`block text-base transition-colors ${activeId === h.id
								? 'text-blue-800 font-bold'
								: 'text-blue-600 hover:text-blue-700'
								}`}
						>
							{h.text}
						</a>
					</li>
				))}
			</ul>
		</nav>
	)
}
