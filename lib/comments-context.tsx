'use client';

import React, { createContext, useContext, useState } from 'react';

export interface Comment {
  id: string;
  evaluationId: string;
  author: string;
  content: string;
  timestamp: Date;
  mentions: string[];
  replies: Comment[];
}

interface CommentContextType {
  comments: Comment[];
  addComment: (evaluationId: string, author: string, content: string) => void;
  addReply: (parentId: string, author: string, content: string) => void;
  deleteComment: (id: string) => void;
  getCommentsByEvaluation: (evaluationId: string) => Comment[];
}

const CommentContext = createContext<CommentContextType | undefined>(undefined);

const MOCK_COMMENTS: Comment[] = [
  {
    id: 'com1',
    evaluationId: 'ev1',
    author: 'Fatima Zohra',
    content: 'Excellente évaluation. Les forces identifiées sont solides notamment sur la stabilité du sponsor.',
    timestamp: new Date('2026-03-16T10:30:00'),
    mentions: [],
    replies: [
      {
        id: 'com1r1',
        evaluationId: 'ev1',
        author: 'Ahmed Ben Selhami',
        content: '@Fatima Zohra Merci pour l\'analyse. À confirmer avec les documents additionnels.',
        timestamp: new Date('2026-03-16T11:45:00'),
        mentions: ['Fatima Zohra'],
        replies: [],
      },
    ],
  },
  {
    id: 'com2',
    evaluationId: 'ev1',
    author: 'Mohamed Karim',
    content: 'À surveiller: le risque de marché sur le D4 pourrait augmenter en cas de baisse du prix spot.',
    timestamp: new Date('2026-03-16T14:20:00'),
    mentions: [],
    replies: [],
  },
];

export function CommentProvider({ children }: { children: React.ReactNode }) {
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);

  const addComment = (evaluationId: string, author: string, content: string) => {
    const newComment: Comment = {
      id: `com_${Date.now()}`,
      evaluationId,
      author,
      content,
      timestamp: new Date(),
      mentions: extractMentions(content),
      replies: [],
    };
    setComments(prev => [...prev, newComment]);
  };

  const addReply = (parentId: string, author: string, content: string) => {
    setComments(prev =>
      prev.map(comment =>
        comment.id === parentId
          ? {
              ...comment,
              replies: [
                ...comment.replies,
                {
                  id: `com_${Date.now()}`,
                  evaluationId: comment.evaluationId,
                  author,
                  content,
                  timestamp: new Date(),
                  mentions: extractMentions(content),
                  replies: [],
                },
              ],
            }
          : comment
      )
    );
  };

  const deleteComment = (id: string) => {
    setComments(prev => prev.filter(comment => comment.id !== id));
  };

  const getCommentsByEvaluation = (evaluationId: string) => {
    return comments.filter(comment => comment.evaluationId === evaluationId);
  };

  return (
    <CommentContext.Provider
      value={{
        comments,
        addComment,
        addReply,
        deleteComment,
        getCommentsByEvaluation,
      }}
    >
      {children}
    </CommentContext.Provider>
  );
}

export function useComments() {
  const context = useContext(CommentContext);
  if (context === undefined) {
    throw new Error('useComments must be used within CommentProvider');
  }
  return context;
}

function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = content.match(mentionRegex);
  return matches ? matches.map(m => m.slice(1)) : [];
}
