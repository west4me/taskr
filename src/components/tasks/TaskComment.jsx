import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { Edit2, Check, X, Trash2 } from 'lucide-react';
import { useState } from 'react';
import RichTextEditor from './RichTextEditor';

/**
 * decodeHTML:
 * Simple helper to convert any encoded HTML
 * (e.g. &lt;p&gt;Hello&lt;/p&gt;) back to raw HTML (<p>Hello</p>).
 */
function decodeHTML(htmlString) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = htmlString;
  return textarea.value;
}

const TaskComment = ({ comment, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    if (editedContent.trim() && editedContent !== comment.content) {
      onUpdate(comment.id, editedContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(comment.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(comment.id);
    setShowDeleteConfirm(false);
  };

  // Decode if your DB is storing escaped HTML like '&lt;p&gt;Hello&lt;/p&gt;'
  const decodedContent = decodeHTML(comment.content);

  return (
    <div className="py-3 border-b border-[var(--color-secondary)]/20 last:border-0">
      <div className="flex flex-col gap-2">
        {isEditing ? (
          <div className="space-y-2">
            <RichTextEditor
              value={editedContent}
              onChange={setEditedContent}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="btn btn-secondary"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="group relative">
            <div className="prose prose-sm max-w-none text-[var(--color-text)]"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(decodedContent),
              }}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-[var(--color-secondary)]">
                {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 hover:bg-[var(--color-secondary)]/10 rounded"
                  title="Edit comment"
                >
                  <Edit2 className="w-4 h-4 text-[var(--color-secondary)]" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1 hover:bg-[var(--color-primary)]/10 rounded"
                  title="Delete comment"
                >
                  <Trash2 className="w-4 h-4 text-[var(--color-primary)]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="mt-2 p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-primary)]/30">
          <p className="text-sm text-[var(--color-text)] mb-3">
            Are you sure you want to delete this comment?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="btn btn-secondary px-3 py-1 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-primary px-3 py-1 text-sm rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

TaskComment.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default TaskComment;