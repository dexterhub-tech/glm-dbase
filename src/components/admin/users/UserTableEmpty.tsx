
import { TableCell, TableRow } from "@/components/ui/table";

const UserTableEmpty = () => {
  return (
    <TableRow>
      <TableCell colSpan={4} className="text-center py-4">
        No users found
      </TableCell>
    </TableRow>
  );
};

export default UserTableEmpty;
