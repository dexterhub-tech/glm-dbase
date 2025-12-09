export type AdminUser = {
  id: string; // maps from backend _id
  email: string;
  fullName: string | null;
  role: "admin" | "user" | "superadmin" | "pastor";
  isActive?: boolean;
  isSuperUser?: boolean; // Computed: role === 'superadmin'
};
