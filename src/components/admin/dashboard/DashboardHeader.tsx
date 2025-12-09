
import { useAuth } from "@/contexts/AuthContext";

interface DashboardHeaderProps {
  title: string;
  description: string;
}

const DashboardHeader = ({ title, description }: DashboardHeaderProps) => {
  const { isSuperUser } = useAuth();

  return (
    <div className="mb-6 md:mb-8 bg-white p-4 rounded-lg shadow-md">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
        {isSuperUser ? (
          <span className="flex items-center">
          Dashboard
          </span>
        ) : (
          title
        )}
      </h1>
      <p className="text-sm md:text-base text-gray-600 mt-1">
        {isSuperUser
          ? "Full access to manage all system features"
          : description}
      </p>
    </div>
  );
};

export default DashboardHeader;
