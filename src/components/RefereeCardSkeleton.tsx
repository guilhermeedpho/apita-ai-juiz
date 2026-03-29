import { Skeleton } from "@/components/ui/skeleton";

const RefereeCardSkeleton = () => (
  <div className="bg-gradient-card rounded-2xl border border-border shadow-card overflow-hidden p-6">
    <div className="flex items-start gap-4 mb-4">
      <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-10" />
    </div>
    <div className="flex gap-1.5 mb-3">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
    <Skeleton className="h-3 w-28 mb-4" />
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
  </div>
);

export default RefereeCardSkeleton;
