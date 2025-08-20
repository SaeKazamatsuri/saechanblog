// src/components/layout/Header.tsx
import { getCategories } from '@/lib/getCategories'
import HeaderClient from './HeaderClient'

export default function Header() {
    const categories = getCategories()
    return <HeaderClient categories={categories} />
}
