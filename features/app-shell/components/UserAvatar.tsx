import Image from "next/image";
import type { AccountUser } from "@/features/account/types";

export default function UserAvatar({
  user,
  className = "h-9 w-9",
}: {
  user: AccountUser | null | undefined;
  className?: string;
}) {
  const initials =
    user?.name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AS";

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-lime text-xs font-bold text-black ${className}`}
      aria-hidden="true"
    >
      {user?.avatar ? (
        <Image
          src={user.avatar}
          alt=""
          fill
          sizes="40px"
          unoptimized
          className="object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}
