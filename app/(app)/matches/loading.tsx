import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton";

export default function MatchesLoading() {
  return (
    <SkeletonScreen label="Loading your matches">
      <Skeleton className="h-14 w-64" />
      <div className="mt-10 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    </SkeletonScreen>
  );
}
