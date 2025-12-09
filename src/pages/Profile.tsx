import { useAuth } from "@/contexts/AuthContext";
import { PersonalProfilePage } from "@/components/profile/PersonalProfilePage";
import { useEffect } from "react";

const Profile = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Set page title
    document.title = "My Profile | GLM Church";
  }, []);

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-gray-600 mb-6">
            You need to be signed in to view your profile.
          </p>
          <a
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return <PersonalProfilePage />;
};

export default Profile;
