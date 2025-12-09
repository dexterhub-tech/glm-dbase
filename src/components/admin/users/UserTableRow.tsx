
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { type AdminUser } from "./types";

type UserTableRowProps = {
  user: AdminUser;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
};

const UserTableRow = ({ user, onEdit, onDelete }: UserTableRowProps) => {
  return (
    <TableRow key={user.id}>
      <TableCell>{user.fullName || 'N/A'}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge variant={
          user.role === "superadmin" || user.isSuperUser ? "destructive" : 
          user.role === "admin" ? "default" : 
          "secondary"
        }>
          {user.role === "superadmin" || user.isSuperUser ? "Super Admin" : user.role}
        </Badge>
      </TableCell>
      <TableCell className="text-right space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(user)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(user)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default UserTableRow;
