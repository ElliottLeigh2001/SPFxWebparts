import * as React from 'react';
import { useState, useEffect } from 'react';
import { TTLComment } from '../../Interfaces/TTLCommentInterface';
import { getCommentsForRequest } from '../../service/CommentService';
import styles from './CommentsSection.module.scss';
import requestDetailsStyles from './RequestDetails.module.scss'
import { ICommentsSectionProps } from './RequestDetailsProps';

const CommentsSection: React.FC<ICommentsSectionProps> = ({ requestId, context }) => {
  const [comments, setComments] = useState<TTLComment[]>([]);
  const [loading, setLoading] = useState(true);

  // Load the comments for this request
  useEffect(() => {
    loadComments();
  }, [requestId]);

  // Send API call to retrieve comments linked to this request
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
      <div className={requestDetailsStyles.titleContainer}>
        <h3 className={requestDetailsStyles.panelHeader}>Comments</h3>
      </div>
      
      <div className={styles.commentsList}>
        {loading ? (
          <div>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div style={{marginLeft: '10px'}}>No comments yet</div>
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