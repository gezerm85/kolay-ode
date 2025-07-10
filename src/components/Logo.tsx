import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center" aria-label="Dashboard">
      <Image
        src="https://kereste.com.tr/images/logo-e2.png"
        alt="Kereste.com.tr Logo"
        width={140}
        height={32}
        priority
        className="h-8 w-auto"
      />
    </Link>
  );
}
