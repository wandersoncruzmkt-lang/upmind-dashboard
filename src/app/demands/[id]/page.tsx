'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Trash2, Loader2, Clock, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { DemandWithRelations, User as UserType, FileWithUploader, StatusHistory } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import CommentThread from '@/components/CommentThread';
import FileUploader from '@/components/FileUploader';
import toast from 'react-hot-toast';

export default function DemandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [demand, setDemand] = useState<DemandWithRelations | null>(null);
  const [files, setFiles] = useState<FileWithUploader[]>([]);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'comments' | 'files' | 'history'>('comments');
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    loadAll();
  }, [id]);

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [userRes, demandRes, filesRes, historyRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase
        .from('demands')
        .select('*, assignee:users!assigned_to(*), creator:users!created_by(*), client:clients(*), project:projects(*)')
        .eq('id', id)
        .single(),
      fetch(`/api/demands/${id}/files`).then((r) => r.json()),
      supabase
        .from('status_history')
        .select('*')
        .eq('demand_id', id)
        .order('created_at', { ascending: false }),
    ]);

    setCurrentUser(userRes.data);
    setDemand(demandRes.data as DemandWithRelations);
    setFiles(filesRes.data ?? []);
    setHistory(historyRes.data ?? []);
    setLoading(false);
  }

  async function handleStatusChange(newStatus: string) {
    if (!demand) return;
    const { error } = await supabase
      .from('demands')
      .update({ status: newStatus as DemandWithRelations['status'] })
      .eq('id', demand.id);

    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      setDemand((prev) => prev ? { ...prev, status: newStatus as DemandWithRelations['status'] } : null);
      toast.success('Status atualizado!');
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir esta demanda?')) return;
    const { error } = await supabase.from('demands').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir');
    } else {
      toast.success('Demanda excluída');
      router.push('/demands');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-accent animate-spin" />
      </div>
    );
  }

  if (!demand) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Demanda não encontrada.</p>
        <Link href="/demands" className="btn-secondary mt-4 inline-block">Voltar</Link>
      </div>
    );
  }

  const canEdit = currentUser && (
    ['admin', 'manager'].includes(currentUser.role) ||
    demand.assigned_to === currentUser.id ||
    demand.created_by === currentUser.id
  );

  const STATUS_TRANSITIONS: Record<string, string[]> = {
    backlog: ['in_progress', 'cancelled'],
    in_progress: ['review', 'backlog', 'cancelled'],
    review: ['approved', 'in_progress', 'cancelled'],
    approved: ['delivered', 'in_progress'],
    delivered: ['approved'],
    cancelled: ['backlog'],
  };

  const nextStatuses = STATUS_TRANSITIONS[demand.status] ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/demands" className="p-2 text-gray-400 hover:text-white hover:bg-dark-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusBadge status={demand.status} />
            <PriorityBadge priority={demand.priority} />
          </div>
          <h1 className="text-xl font-bold text-white truncate">{demand.title}</h1>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {nextStatuses.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className="btn-secondary text-sm"
              >
                → {s.replace('_', ' ')}
              </button>
            ))}
            <button
              onClick={handleDelete}
              className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {demand.description && (
            <div className="card">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Descrição</h3>
              <p className="text-sm text-white whitespace-pre-wrap">{demand.description}</p>
            </div>
          )}

          {demand.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {demand.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 bg-dark-card border border-dark-border rounded-lg text-gray-400">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div>
            <div className="flex border-b border-dark-border mb-4">
              {(['comments', 'files', 'history'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-white border-b-2 border-blue-accent'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab === 'comments' ? 'Comentários' : tab === 'files' ? 'Arquivos' : 'Histórico'}
                </button>
              ))}
            </div>

            {activeTab === 'comments' && currentUser && (
              <div className="h-[400px] flex flex-col">
                <CommentThread demandId={demand.id} currentUser={currentUser} />
              </div>
            )}

            {activeTab === 'files' && (
              <div className="space-y-4">
                <FileUploader demandId={demand.id} onUploadComplete={() => loadAll()} />
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center gap-3 p-3 bg-dark-card border border-dark-border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size_bytes / 1024 / 1024).toFixed(2)}MB · {file.uploader?.full_name}
                          </p>
                        </div>
                        {file.url && (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Abrir
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma alteração registrada.</p>
                ) : (
                  history.map((h) => (
                    <div key={h.id} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-accent shrink-0" />
                      <span className="text-gray-400">
                        <span className="text-gray-500 line-through">{h.from_status}</span>
                        {' '}→{' '}
                        <span className="text-white">{h.to_status}</span>
                      </span>
                      <span className="text-gray-600 text-xs ml-auto">
                        {format(new Date(h.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card space-y-4">
            <div>
              <label className="label">Responsável</label>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-accent flex items-center justify-center text-xs font-bold">
                  {demand.assignee ? demand.assignee.full_name.charAt(0) : <User className="w-3 h-3" />}
                </div>
                <span className="text-sm text-white">
                  {demand.assignee?.full_name ?? 'Não atribuído'}
                </span>
              </div>
            </div>

            {demand.client && (
              <div>
                <label className="label">Cliente</label>
                <p className="text-sm text-white">{demand.client.name}</p>
              </div>
            )}

            {demand.project && (
              <div>
                <label className="label">Projeto</label>
                <p className="text-sm text-white">{demand.project.name}</p>
              </div>
            )}

            {demand.due_date && (
              <div>
                <label className="label">Prazo</label>
                <p className="flex items-center gap-1.5 text-sm text-white">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  {format(new Date(demand.due_date + 'T00:00:00'), "dd 'de' MMMM yyyy", { locale: ptBR })}
                </p>
              </div>
            )}

            {demand.estimated_hours != null && (
              <div>
                <label className="label">Horas estimadas</label>
                <p className="flex items-center gap-1.5 text-sm text-white">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  {demand.estimated_hours}h
                </p>
              </div>
            )}

            <div>
              <label className="label">Criado em</label>
              <p className="text-sm text-gray-400">
                {format(new Date(demand.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
