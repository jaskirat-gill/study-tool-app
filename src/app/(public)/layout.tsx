import { AuthProviderWrapper } from '@/components/AuthProviderWrapper';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProviderWrapper>
      {children}
    </AuthProviderWrapper>
  );
}
