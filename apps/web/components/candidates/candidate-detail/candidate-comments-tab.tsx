import { useState } from "react";
import { Edit, Trash } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import type { Candidate } from "@workspace/shared/types/candidate";
import type { BaseComment, Comment } from "@workspace/shared/types/comment";
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
    <div className="rounded-2xl border border-brand-border bg-surface">
      <div className="p-6 lg:p-8">
        <h3 className="text-lg font-bold tracking-tight text-ink">
          Comentarios sobre {candidate.name}
        </h3>
      </div>
      <div className="px-6 pb-6 lg:px-8 lg:pb-8">
        <div className="space-y-6">
          {/* New comment form */}
          <div className="space-y-3">
            <Textarea
              placeholder="Añadir un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="rounded-xl border-brand-border bg-canvas text-ink placeholder:text-muted-brand focus:border-electric focus:ring-electric/10 transition-all"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || createCommentMutation.isPending}
                variant="brand"
              >
                {createCommentMutation.isPending
                  ? "Publicando..."
                  : "Publicar comentario"}
              </Button>
            </div>
          </div>

          {/* Comments list */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-brand">
                Cargando comentarios...
              </div>
            ) : comments?.items?.length === 0 ? (
              <div className="text-center py-8 text-muted-brand rounded-xl border border-brand-border-light bg-canvas">
                No hay comentarios aún. ¡Sé el primero en comentar!
              </div>
            ) : (
              comments?.items?.map((comment) => (
                <div
                  key={comment.id}
                  className="flex space-x-4 p-4 rounded-xl border border-brand-border-light hover:border-brand-border transition-colors ease-[cubic-bezier(0.16,1,0.3,1)]"
                >
                  <Avatar className="border border-brand-border">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.user?.name || "Unknown"
                        }`}
                      alt={comment.user?.name || "Usuario"}
                    />
                    <AvatarFallback className="bg-electric/5 text-electric text-xs font-semibold">
                      {comment.user?.name?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-ink">
                          {comment.user?.name || "Usuario desconocido"}
                        </span>
                        <span className="text-xs text-muted-brand ml-2">
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
                                className="text-electric hover:bg-electric/5 rounded-lg"
                                onClick={() => handleUpdateComment(comment.id)}
                                disabled={updateCommentMutation.isPending}
                              >
                                Guardar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-lg"
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
                                className="h-8 w-8 hover:bg-electric/5 hover:text-electric rounded-lg transition-colors"
                                onClick={() => handleEditComment(comment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
                        className="mt-2 rounded-xl border-brand-border bg-canvas text-ink focus:border-electric focus:ring-electric/10"
                      />
                    ) : (
                      <p className="text-sm text-slate-brand leading-relaxed">
                        {comment.comment}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
