export default function RequestAttachmentsPanel({
  requestAttachmentList,
  attachmentsRequestId,
  formatFileSize,
  toLocaleDateTime,
  activeAttachmentId,
  downloadRequestAttachment,
  deleteRequestAttachment,
  activeTaskId
}) {
  return (
<section className="panel activity-panel">
  <h3>Request attachments</h3>
  <p className="helper-text">
    PDFs linked to request {attachmentsRequestId || "(select a request first)"}.
  </p>
  <div className="attachment-list">
    {requestAttachmentList.length === 0 ? (
      <p className="helper-text">No attachments loaded.</p>
    ) : (
      requestAttachmentList.map((attachment) => (
        <article key={attachment.id} className="attachment-item">
          <div>
            <p className="activity-title">{attachment.fileName}</p>
            <p className="activity-detail">
              {formatFileSize(attachment.sizeBytes)} | Uploaded by {attachment.uploadedBy || "-"}
            </p>
            <p className="activity-time">
              {toLocaleDateTime(attachment.uploadedAt)}
            </p>
          </div>
          <div className="inline-actions">
            <button
              type="button"
              className="ghost"
              onClick={() => void downloadRequestAttachment(attachment)}
              disabled={activeAttachmentId === attachment.id}
            >
              {activeAttachmentId === attachment.id ? "Downloading..." : "Download"}
            </button>
            <button
              type="button"
              className="ghost danger"
              onClick={() => void deleteRequestAttachment(attachment.id)}
              disabled={activeTaskId === `delete-request-attachment-${attachment.id}`}
            >
              {activeTaskId === `delete-request-attachment-${attachment.id}`
                ? "Deleting..."
                : "Delete"}
            </button>
          </div>
        </article>
      ))
    )}
  </div>
</section>
  );
}
