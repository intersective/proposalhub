import Image from 'next/image';
import Link from 'next/link';

export default function Logo() {
  const platformName = process.env.NEXT_PUBLIC_PLATFORM_NAME;
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="relative w-8 h-8">
        <Image
          src="/images/logo.svg"
          alt={`${platformName} Logo`}
          fill
          className="object-contain"
          priority
        />
      </div>
      <span className="text-lg font-semibold text-gray-900  dark:text-gray-200">{platformName}</span>
    </Link>
  );
} 