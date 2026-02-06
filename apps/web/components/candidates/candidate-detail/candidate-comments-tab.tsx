import { useState } from "react";
import { Edit, Trash } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import type { Candidate } from "@workspace/shared/types/candidate";
import type { BaseComment, Comment } from "@workspace/shared/types/comment";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import {
  COMMENT_API_KEY,
  createComment,
  deleteComment,
  getAllComments,
  updateComment,
} from "@/lib/api/comment";

interface CandidateCommentsTabProps {
  candidate: Candidate;
}

export const CandidateCommentsTab = ({ candidate }: CandidateCommentsTabProps) => {
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const session = useSession();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: [COMMENT_API_KEY, "candidate", candidate.id],
    queryFn: () => getAllComments({ candidateId: candidate.id }),
  });

  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [COMMENT_API_KEY, "candidate", candidate.id],
      });
      toast.success("Comentario agregado exitosamente");
    },
    onError: () => {
      toast.error("Error al agregar comentario");
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({
      id,
      comment,
    }: {
      id: number;
      comment: Partial<BaseComment>;
    }) => updateComment(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [COMMENT_API_KEY, "candidate", candidate.id],
      });
      toast.success("Comentario actualizado exitosamente");
    },
    onError: () => {
      toast.error("Error al actualizar comentario");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: ({ id, userId }: { id: number; userId: number }) =>
      deleteComment(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [COMMENT_API_KEY, "candidate", candidate.id],
      });
      toast.success("Comentario eliminado exitosamente");
    },
    onError: () => {
      toast.error("Error al eliminar comentario");
    },
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const canEditComment = (comment: Comment) => {
    return (
      session.data?.userId && comment.userId === parseInt(session.data.userId)
    );
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !session.data?.userId) {
      return;
    }

    try {
      await createCommentMutation.mutateAsync({
        candidateId: candidate.id,
        userId: parseInt(session.data.userId),
        comment: newComment.trim(),
      });
      setNewComment("");
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditingText(comment.comment);
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editingText.trim()) {
      return;
    }

    try {
      await updateCommentMutation.mutateAsync({
        id: commentId,
        comment: {
          comment: editingText.trim(),
          userId: parseInt(session.data?.userId || ""),
        },
      });
      setEditingComment(null);
      setEditingText("");
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (
      window.confirm("¿Estás seguro de que quieres eliminar este comentario?")
    ) {
      try {
        await deleteCommentMutation.mutateAsync({
          id: commentId,
          userId: parseInt(session.data?.userId || ""),
        });
      } catch (error) {
        console.error("Error deleting comment:", error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditingText("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comentarios sobre {candidate.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <Textarea
              placeholder="Añadir un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || createCommentMutation.isPending}
              >
                {createCommentMutation.isPending
                  ? "Publicando..."
                  : "Publicar comentario"}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center text-muted-foreground">
                Cargando comentarios...
              </div>
            ) : comments?.items?.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No hay comentarios aún. ¡Sé el primero en comentar!
              </div>
            ) : (
              comments?.items?.map((comment) => (
                <div key={comment.id} className="flex space-x-4">
                  <Avatar>
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.user?.name || "Unknown"
                        }`}
                      alt={comment.user?.name || "Usuario"}
                    />
                    <AvatarFallback>
                      {comment.user?.name?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">
                          {comment.user?.name || "Usuario desconocido"}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      {canEditComment(comment) && (
                        <div className="flex space-x-1">
                          {editingComment === comment.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateComment(comment.id)}
                                disabled={updateCommentMutation.isPending}
                              >
                                Guardar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditComment(comment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500"
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={deleteCommentMutation.isPending}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {editingComment === comment.id ? (
                      <Textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={3}
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-sm">{comment.comment}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
