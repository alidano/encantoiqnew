import AppLayout from '@/components/layout/AppLayout';

export default function NotesTimelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}