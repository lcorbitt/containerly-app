export interface CustomerAppShellProps {
  userId: string;
  email: string;
  fullName: string | null;
  initialProfileImagePath: string | null;
  children: React.ReactNode;
}
