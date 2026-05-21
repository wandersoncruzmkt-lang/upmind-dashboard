'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Lock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx } from 'clsx';
import { getSupabaseBrowserClient, subscribeToCommentsChannel } from '@/lib/supabase';
import type { CommentWithAuthor, User } from '@/lib/types';
import toast from 'react-hot-toast';

interface CommentThreadProps {
  demandId: string;
  currentUser: User;
}

export default function CommentThread({ demandId, currentUser }: CommentThreadProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    loadComments();

    const channel = subscribeToCommentsChannel(demandId, () => {
      loadComments();
    });

    return () => { supabase.removeChannel(channel); };
  }, [demandId]);

  async function loadComments() {
    const { data, error } = await supabase
      .from('comments')
      .select('*, author:users!author_id(*)')
      .eq('demand_id', demandId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data as unknown as CommentWithAuthor[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from('comments').insert({
      demand_id: demandId,
      author_id: currentUser.id,
      content: content.trim(),
      is_internal: isInternal,
    });

    if (error) {
      toast.error('Erro ao enviar comentário');
    } else {
      setContent('');
    }
    setSubmitting(false);
  }

  const canSeeInternal = ['admin', 'manager', 'member'].includes(currentUser.role);

  return (
    <div className="flex flex-col h-full">
      {/* Comments list */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        )}

        {!loading && comments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Nenhum comentário ainda.</p>
            <p className="text-xs text-gray-600 mt-1">Seja o primeiro a comentar!</p>
          </div>
        )}

        {comments.map((comment) => {
          if (comment.is_internal && !canSeeInternal) return null;

          const isOwn = comment.author_id === currentUser.id;

          return (
            <div key={comment.id} className={clsx('flex gap-3', isOwn && 'flex-row-reverse')}>
              <div className="w-8 h-8 rounded-full bg-blue-accent flex items-center justify-center text-xs font-semibold text-white shrink-0">
                {comment.author?.full_name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div className={clsx('max-w-[75%]', isOwn && 'items-end flex flex-col')}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-300">
                    {isOwn ? 'Você' : comment.author?.full_name}
                  </span>
                  {comment.is_internal && (
                    <span className="flex items-center gap-1 text-xs text-yellow-500">
                      <Lock className="w-2.5 h-2.5" /> Interno
                    </span>
                  )}
                  <span className="text-xs text-gray-600">
                    {formatDistanceToNow(new Date(comment.created_at), { locale: ptBR, addSuffix: true })}
                  </span>
                </div>
                <div className={clsx(
                  'rounded-xl px-3 py-2 text-sm text-white',
                  comment.is_internal
                    ? 'bg-yellow-900/30 border border-yellow-700/40'
                    : isOwn
                    ? 'bg-blue-accent'
                    : 'bg-dark-card border border-dark-border'
                )}>
                  {comment.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4 border-t border-dark-border pt-4">
        {canSeeInternal && (
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setIsInternal(!isInternal)}
              className={clsx(
                'flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors',
                isInternal
                  ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/40'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <Lock className="w-3 h-3" />
              {isInternal ? 'Nota interna' : 'Marcar como interno'}
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Escreva um comentário... (Enter para enviar)"
            rows={2}
            className="input resize-none flex-1"
          />
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="btn-primary px-3 self-end"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
