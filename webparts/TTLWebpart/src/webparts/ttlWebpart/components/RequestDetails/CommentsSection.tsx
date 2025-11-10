import * as React from 'react';
import { useState, useEffect } from 'react';
import { TTLComment } from '../../Interfaces/TTLCommentInterface';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { getCommentsForRequest } from '../../service/CommentService';
import styles from './CommentsSection.module.scss';

interface CommentsSectionProps {
  requestId: number;
  context: WebPartContext;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ requestId, context }) => {
  const [comments, setComments] = useState<TTLComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [requestId]);

  const loadComments = async () => {
    try {
      const requestComments = await getCommentsForRequest(context, requestId);
      setComments(requestComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.commentsSection}>
      <h2>Comments ({comments.length})</h2>
      
      <div className={styles.commentsList}>
        {loading ? (
          <div>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div>No comments yet</div>
        ) : (
          comments.map(comment => (
            <div key={comment.ID} className={styles.commentItem}>
              <div className={styles.commentHeader}>
                <span className={styles.commentAuthor}>{comment.Author?.Title || 'Unknown'}</span>
                <span className={styles.commentDate}>
                  {new Date(comment.Created || '').toLocaleString()}
                </span>
              </div>
                <div
                className={styles.commentBody}
                dangerouslySetInnerHTML={{ __html: comment.Body || '' }}
                />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentsSection;