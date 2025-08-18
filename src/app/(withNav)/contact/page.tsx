import ContactForm from './ContactForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'お問い合わせフォーム',
    description: 'ショートランドのこかげ(sae-chan.net)のお問い合わせフォーム',
}

export default function Page() {
    return <ContactForm />
}
