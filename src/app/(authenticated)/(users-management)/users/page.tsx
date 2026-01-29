import { AddUserButton } from "@/components/custom/users/add-user-button";
import { getAllUsersAction } from "@/actions/user-management";
import { UsersTable } from "@/components/custom/users/users-table";

export default async function Page() {
    const users = await getAllUsersAction()
    
    return (
        <div className="px-4">
            <div>
                <h1 className="text-2xl font-bold">All Users</h1>
            </div>
            <div className="custom-container" >
                <div className=" mb-4">
                    <AddUserButton />
                </div>

                <div className="w-full">
                    <UsersTable users={users.users || []} />
                </div>
            </div>
        </div>
    );
}