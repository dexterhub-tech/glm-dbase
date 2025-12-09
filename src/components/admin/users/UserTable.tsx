import { type AdminUser } from "./types";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import UserTableLoading from "./UserTableLoading";
import UserTableEmpty from "./UserTableEmpty";
import UserTableRow from "./UserTableRow";

type UserTableProps = {
  users: AdminUser[];
  loading: boolean;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
};

const UserTable = ({ users, loading, onEdit, onDelete }: UserTableProps) => {
  if (loading) return <UserTableLoading />;

  return (
    <div className=" md:block overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="inline-block min-w-full align-middle px-4 sm:px-6 lg:px-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Name</TableHead>
              <TableHead className="whitespace-nowrap">Email</TableHead>
              <TableHead className="whitespace-nowrap">Role</TableHead>
              <TableHead className="w-[100px] whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <UserTableEmpty />
            ) : (
              users.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserTable;
