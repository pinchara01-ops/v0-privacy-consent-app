import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Privacy Consent Demo - Social Media Platform",
    description: "Demo of post-level privacy consent management",
}

export default function DemoLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
