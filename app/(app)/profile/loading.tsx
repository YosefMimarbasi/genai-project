import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <SkeletonScreen label="Loading your profile">
      <Skeleton className="h-14 w-[min(20rem,75%)]" />
      <Skeleton className="mt-5 h-6 w-[min(24rem,85%)]" />

      <div className="mt-10 flex flex-wrap gap-2">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-11 w-32" />
        ))}
      </div>

      <Skeleton className="mt-8 h-12 w-full max-w-xs" />
    </SkeletonScreen>
  );
}
