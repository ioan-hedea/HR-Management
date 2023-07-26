import CurrentContractCard from "../components/me/CurrentContractCard";
import ProfileOverviewCard from "../components/me/ProfileOverviewCard";
import RequestSummaryCard from "../components/me/RequestSummaryCard";

export default function MePage({
  profileData,
  activeNetId,
  isAdmin,
  currentContractData,
  requestStats,
  isProfileLoading,
  formatEnumLabel,
  toLocaleDateTime,
  loadPersonalDashboard,
  navigate,
  activeSectionId
}) {
  const showProfile = activeSectionId === "me-profile";
  const showContract = activeSectionId === "me-contract";
  const showSummary = activeSectionId === "me-summary";

  return (
    <section className="portal-grid">
      {showProfile && (
        <ProfileOverviewCard
          profileData={profileData}
          activeNetId={activeNetId}
          isAdmin={isAdmin}
          formatEnumLabel={formatEnumLabel}
        />
      )}

      {showContract && (
        <CurrentContractCard
          currentContractData={currentContractData}
          formatEnumLabel={formatEnumLabel}
          toLocaleDateTime={toLocaleDateTime}
        />
      )}

      {showSummary && (
        <RequestSummaryCard
          requestStats={requestStats}
          formatEnumLabel={formatEnumLabel}
          toLocaleDateTime={toLocaleDateTime}
          loadPersonalDashboard={loadPersonalDashboard}
          isProfileLoading={isProfileLoading}
          navigate={navigate}
        />
      )}
    </section>
  );
}
