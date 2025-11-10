import { WebPartContext } from "@microsoft/sp-webpart-base";
import { getSP } from "./TTLService";
import { TTLComment } from "../Interfaces/TTLCommentInterface";

// Create a new comment
export const createComment = async (context: WebPartContext, comment: TTLComment, requestId?: number): Promise<number> => {
  const sp = getSP(context);
  const list = sp.web.lists.getByTitle('TTL_Comments');

  const commentData: any = {
    Title: comment.Title,
    Body: comment.Body
  };

  // If a RequestId is provided, set the lookup field on the comment (reverse lookup)
  if (typeof requestId === 'number') {
    commentData.RequestIDId = requestId;
  }

  const addResult = await list.items.add(commentData);
  // pnp returns an object with Id on the add result
  return addResult.Id;
};

// Get comments for a request
export const getCommentsForRequest = async (context: WebPartContext, requestId: number): Promise<TTLComment[]> => {
  try {
    const sp = getSP(context);
    const commentsList = sp.web.lists.getByTitle('TTL_Comments');

    const items = await commentsList.items
      .select('Id,Title,Body,Author/Title,Author/EMail,Created')
      .expand('Author')
      .filter(`RequestIDId eq ${requestId}`)();

    return items.map((comment: any) => ({
      ID: comment.Id,
      Title: comment.Title,
      Body: comment.Body,
      Author: {
        Title: comment.Author?.Title,
        EMail: comment.Author?.EMail
      },
      Created: comment.Created
    }));
  } catch (error) {
    console.error('Error getting comments:', error);
    return [];
  }
};
