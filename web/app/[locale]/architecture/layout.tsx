import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'System Architecture | Jarvis Neural Dashboard',
    description: 'Complete documentation of the Jarvis AI Orchestration System',
};

export default function ArchitectureLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
