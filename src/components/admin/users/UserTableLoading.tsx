
import { Skeleton } from "@/components/ui/skeleton";

const UserTableLoading = () => {
  return (
    <div className="flex justify-center py-8">
      <div className="space-y-2 w-full">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
};

export default UserTableLoading;
