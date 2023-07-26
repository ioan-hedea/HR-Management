export default function AdminAccessNotice() {
  return (
    <section className="panel restricted">
      <h2>Admin area</h2>
      <p className="helper-text">
        This section is available only with an ADMIN token.
      </p>
    </section>
  );
}
