'use client';

import React, { useState } from 'react';
import { Send, MessageSquare, User } from 'lucide-react';

export interface CommentData {
  id: string;
  content: string;
  commentType: string;
  isInternal: boolean;
  createdBy: string;
  createdByUser?: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
  };
  createdAt: string;
  isResolved?: boolean;
  replies?: CommentData[];
}

interface WorkflowCommentThreadProps {
  comments: CommentData[];
  onAddComment: (content: string, commentType: string, isInternal: boolean) => Promise<void>;
  isLoading?: boolean;
}

const COMMENT_TYPES = [
  { value: 'GENERAL', label: 'Commentaire général' },
  { value: 'QUESTION', label: 'Question' },
  { value: 'ISSUE', label: 'Problème' },
  { value: 'SUGGESTION', label: 'Suggestion' }
];

export function WorkflowCommentThread({
  comments,
  onAddComment,
  isLoading = false
}: WorkflowCommentThreadProps) {
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('GENERAL');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment, commentType, isInternal);
      setNewComment('');
      setCommentType('GENERAL');
      setIsInternal(false);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = (comment: CommentData, isReply = false) => (
    <div
      key={comment.id}
      className={`space-y-2 ${
        isReply ? 'ml-8 border-l-2 border-border pl-4 py-2' : 'pb-4'
      }`}
    >
      <div className={`p-3 rounded-lg ${
        isInternal || comment.isInternal ? 'bg-warning/10 border border-yellow-200' : 'bg-muted border border-border'
      }`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-foreground">
                  {comment.createdByUser?.prenom} {comment.createdByUser?.nom}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  comment.commentType === 'QUESTION' ? 'bg-primary/10 text-primary' :
                  comment.commentType === 'ISSUE' ? 'bg-destructive/10 text-destructive' :
                  comment.commentType === 'SUGGESTION' ? 'bg-success/10 text-success' :
                  'bg-muted text-secondary-foreground'
                }`}>
                  {COMMENT_TYPES.find(t => t.value === comment.commentType)?.label}
                </span>
                {comment.isInternal && (
                  <span className="text-xs px-2 py-0.5 rounded bg-warning/10 text-warning font-medium">
                    Interne
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(comment.createdAt).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
          {comment.isResolved && (
            <span className="text-xs px-2 py-1 bg-success/10 text-success font-medium rounded">
              Résolu
            </span>
          )}
        </div>
        <p className="text-sm text-secondary-foreground mt-2 whitespace-pre-wrap">{comment.content}</p>
      </div>

      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Comments List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Commentaires ({comments.length})</h3>

        {comments.length === 0 ? (
          <div className="p-8 text-center bg-muted rounded-lg border border-border">
            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Aucun commentaire pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </div>

      {/* Add Comment Form */}
      <div className="bg-white border border-border rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-4">Ajouter un commentaire</h4>
        <form onSubmit={handleAddComment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-foreground mb-1">
                Type de commentaire
              </label>
              <select
                value={commentType}
                onChange={(e) => setCommentType(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {COMMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm font-medium text-secondary-foreground">
                  Commentaire interne
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-foreground mb-2">
              Contenu du commentaire
            </label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={3}
              placeholder="Entrez votre commentaire..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoading || !newComment.trim()}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:bg-secondary transition-colors"
          >
            <Send className="w-4 h-4" />
            {isSubmitting || isLoading ? 'Envoi...' : 'Envoyer'}
          </button>
        </form>
      </div>
    </div>
  );
}
