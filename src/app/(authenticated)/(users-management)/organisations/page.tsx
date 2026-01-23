import { AddOrganisationButton } from "@/components/custom/organisations/add-organisation-button";
import { getAllOrganisationsAction } from "@/actions/user-management";
import { OrganisationsTable } from "../../../../components/custom/organisations/organisations-table";

export default async function Page() {
    const organisations = await getAllOrganisationsAction()
    
    return (
        <div className="px-4">
            <div>
                <h1 className="text-2xl font-bold">All Organisations</h1>
            </div>
            <div className="custom-container" >
                <div className=" mb-4">
                    <AddOrganisationButton />
                </div>

                <div className="w-full">
                    <OrganisationsTable organisations={organisations.organisations || []} />
                </div>
            </div>
        </div>
    );
}