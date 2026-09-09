import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton";

/* Mirrors the real ready-up layout so nothing jumps when it swaps in. */
export default function PlayLoading() {
  return (
    <SkeletonScreen label="Loading the queue">
      <Skeleton className="h-14 w-[min(22rem,80%)]" />
      <Skeleton className="mt-5 h-6 w-[min(18rem,60%)]" />

      <div className="mt-10 flex flex-col gap-7">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="grid gap-4 sm:grid-cols-[auto_1fr] sm:gap-6">
            <div className="flex items-start gap-3 sm:w-40">
              <Skeleton className="h-8 w-8 shrink-0" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2].map((j) => (
                <Skeleton key={j} className="h-11 w-28" />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Skeleton className="mt-8 h-14 w-40" />
    </SkeletonScreen>
  );
}
