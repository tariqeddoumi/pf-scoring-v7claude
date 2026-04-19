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
        isReply ? 'ml-8 border-l-2 border-gray-200 pl-4 py-2' : 'pb-4'
      }`}
    >
      <div className={`p-3 rounded-lg ${
        isInternal || comment.isInternal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-gray-900">
                  {comment.createdByUser?.prenom} {comment.createdByUser?.nom}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  comment.commentType === 'QUESTION' ? 'bg-blue-100 text-blue-700' :
                  comment.commentType === 'ISSUE' ? 'bg-red-100 text-red-700' :
                  comment.commentType === 'SUGGESTION' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {COMMENT_TYPES.find(t => t.value === comment.commentType)?.label}
                </span>
                {comment.isInternal && (
                  <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">
                    Interne
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(comment.createdAt).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
          {comment.isResolved && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 font-medium rounded">
              Résolu
            </span>
          )}
        </div>
        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{comment.content}</p>
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
        <h3 className="text-lg font-semibold text-gray-900">Commentaires ({comments.length})</h3>

        {comments.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
            <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Aucun commentaire pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </div>

      {/* Add Comment Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Ajouter un commentaire</h4>
        <form onSubmit={handleAddComment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de commentaire
              </label>
              <select
                value={commentType}
                onChange={(e) => setCommentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  Commentaire interne
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenu du commentaire
            </label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Entrez votre commentaire..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoading || !newComment.trim()}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <Send className="w-4 h-4" />
            {isSubmitting || isLoading ? 'Envoi...' : 'Envoyer'}
          </button>
        </form>
      </div>
    </div>
  );
}
