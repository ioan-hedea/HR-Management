import AdminAccessNotice from "../components/admin/AdminAccessNotice";
import AdminCatalogManagementSection from "../components/admin/AdminCatalogManagementSection";
import AdminOverviewSection from "../components/admin/AdminOverviewSection";

export default function AdminPage({
  isAdmin,
  registerFromAdmin,
  registerForm,
  setRegisterForm,
  isRegisterLoading,
  adminNotice,
  adminActions,
  actionResults,
  runPortalAction,
  activeActionId,
  contractLookupForm,
  setContractLookupForm,
  lookupContract,
  activeTaskId,
  deleteContractForm,
  setDeleteContractForm,
  deleteContract,
  salaryScaleUpdateForm,
  setSalaryScaleUpdateForm,
  updateSalaryScaleRange,
  renameJobPosition,
  renameJobPositionForm,
  setRenameJobPositionForm,
  renamePensionScheme,
  renamePensionSchemeForm,
  setRenamePensionSchemeForm,
  deleteCatalogEntity,
  deleteCatalogForm,
  setDeleteCatalogForm,
  activeSectionId
}) {
  if (!isAdmin) {
    return <AdminAccessNotice />;
  }

  return (
    <>
      {activeSectionId === "admin-overview" && (
        <AdminOverviewSection
          registerFromAdmin={registerFromAdmin}
          registerForm={registerForm}
          setRegisterForm={setRegisterForm}
          isRegisterLoading={isRegisterLoading}
          adminNotice={adminNotice}
          adminActions={adminActions}
          actionResults={actionResults}
          runPortalAction={runPortalAction}
          activeActionId={activeActionId}
        />
      )}

      {activeSectionId === "admin-operations" && (
        <AdminCatalogManagementSection
          activeTaskId={activeTaskId}
          contractLookupForm={contractLookupForm}
          setContractLookupForm={setContractLookupForm}
          lookupContract={lookupContract}
          deleteContractForm={deleteContractForm}
          setDeleteContractForm={setDeleteContractForm}
          deleteContract={deleteContract}
          salaryScaleUpdateForm={salaryScaleUpdateForm}
          setSalaryScaleUpdateForm={setSalaryScaleUpdateForm}
          updateSalaryScaleRange={updateSalaryScaleRange}
          renameJobPosition={renameJobPosition}
          renameJobPositionForm={renameJobPositionForm}
          setRenameJobPositionForm={setRenameJobPositionForm}
          renamePensionScheme={renamePensionScheme}
          renamePensionSchemeForm={renamePensionSchemeForm}
          setRenamePensionSchemeForm={setRenamePensionSchemeForm}
          deleteCatalogEntity={deleteCatalogEntity}
          deleteCatalogForm={deleteCatalogForm}
          setDeleteCatalogForm={setDeleteCatalogForm}
        />
      )}
    </>
  );
}
