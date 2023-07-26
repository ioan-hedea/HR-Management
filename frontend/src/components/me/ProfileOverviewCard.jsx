export default function ProfileOverviewCard({ profileData, activeNetId, isAdmin, formatEnumLabel }) {
  return (
    <article id="me-profile" className="panel">
      <h2>Profile overview</h2>
      <p className="helper-text">
        Your account details and role in the HR platform.
      </p>
      <div className="response-area friendly">
        <p className="activity-title">
          {profileData?.firstName || profileData?.lastName
            ? `${profileData?.firstName || ""} ${profileData?.lastName || ""}`.trim()
            : activeNetId}
        </p>
        <p className="activity-detail">NetID: {profileData?.netId || activeNetId || "-"}</p>
        <p className="activity-detail">
          Role: {profileData?.role ? formatEnumLabel(profileData.role) : (isAdmin ? "Admin" : "User")}
        </p>
        <p className="activity-detail">Email: {profileData?.email || "-"}</p>
        <p className="activity-detail">Phone: {profileData?.phoneNumber || "-"}</p>
        <p className="activity-detail">Address: {profileData?.address || "-"}</p>
      </div>
    </article>
  );
}
