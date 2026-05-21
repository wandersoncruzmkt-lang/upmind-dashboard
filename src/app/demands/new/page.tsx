'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { Client, Project, User, DemandType, DemandPriority } from '@/lib/types';
import toast from 'react-hot-toast';

const TYPES: { value: DemandType; label: string; emoji: string }[] = [
  { value: 'design', label: 'Design', emoji: '🎨' },
  { value: 'copy', label: 'Copywriting', emoji: '✍️' },
  { value: 'video', label: 'Vídeo', emoji: '🎬' },
  { value: 'social', label: 'Social Media', emoji: '📱' },
  { value: 'task', label: 'Tarefa', emoji: '✅' },
  { value: 'other', label: 'Outro', emoji: '📦' },
];

const PRIORITIES: { value: DemandPriority; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

export default function NewDemandPage() {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'task' as DemandType,
    priority: 'medium' as DemandPriority,
    client_id: '',
    project_id: '',
    assigned_to: '',
    due_date: '',
    estimated_hours: '',
    tags: '',
  });

  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    loadFormData();
  }, []);

  async function loadFormData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [userRes, clientsRes, projectsRes, membersRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.from('clients').select('*').eq('is_active', true).order('name'),
      supabase.from('projects').select('*').eq('status', 'active').order('name'),
      supabase.from('users').select('*').eq('is_active', true).order('full_name'),
    ]);

    setCurrentUser(userRes.data);
    setClients(clientsRes.data ?? []);
    setProjects(projectsRes.data ?? []);
    setTeamMembers(membersRes.data ?? []);
  }

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !currentUser) return;
    setLoading(true);

    const tags = form.tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const { data, error } = await supabase.from('demands').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      priority: form.priority,
      status: 'backlog',
      team_id: currentUser.team_id!,
      client_id: form.client_id || null,
      project_id: form.project_id || null,
      assigned_to: form.assigned_to || null,
      created_by: currentUser.id,
      due_date: form.due_date || null,
      estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
      tags,
    }).select().single();

    if (error) {
      toast.error('Erro ao criar demanda: ' + error.message);
      setLoading(false);
      return;
    }

    toast.success('Demanda criada com sucesso!');
    router.push(`/demands/${data.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/demands" className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-dark-secondary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nova Demanda</h1>
          <p className="text-sm text-gray-500">Preencha os detalhes da demanda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type selector */}
        <div>
          <label className="label">Tipo</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(({ value, label, emoji }) => (
              <button
                key={value}
                type="button"
                onClick={() => update('type', value)}
                className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                  form.type === value
                    ? 'border-blue-accent bg-blue-accent/20 text-white'
                    : 'border-dark-border bg-dark-secondary text-gray-400 hover:text-white'
                }`}
              >
                <span>{emoji}</span> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="label" htmlFor="title">Título *</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className="input"
            placeholder="Ex: Banner para campanha de verão"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="label" htmlFor="description">Descrição</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="input resize-none"
            placeholder="Descreva os detalhes, referências, formato esperado..."
            rows={4}
          />
        </div>

        {/* Priority + Due date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Prioridade</label>
            <select
              value={form.priority}
              onChange={(e) => update('priority', e.target.value)}
              className="input"
            >
              {PRIORITIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="due_date">Prazo</label>
            <input
              id="due_date"
              type="date"
              value={form.due_date}
              onChange={(e) => update('due_date', e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Client + Project */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Cliente</label>
            <select
              value={form.client_id}
              onChange={(e) => update('client_id', e.target.value)}
              className="input"
            >
              <option value="">Sem cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Projeto</label>
            <select
              value={form.project_id}
              onChange={(e) => update('project_id', e.target.value)}
              className="input"
            >
              <option value="">Sem projeto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Assigned + Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Responsável</label>
            <select
              value={form.assigned_to}
              onChange={(e) => update('assigned_to', e.target.value)}
              className="input"
            >
              <option value="">Não atribuído</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="hours">Horas estimadas</label>
            <input
              id="hours"
              type="number"
              value={form.estimated_hours}
              onChange={(e) => update('estimated_hours', e.target.value)}
              className="input"
              placeholder="0"
              min="0"
              step="0.5"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="label" htmlFor="tags">Tags (separadas por vírgula)</label>
          <input
            id="tags"
            type="text"
            value={form.tags}
            onChange={(e) => update('tags', e.target.value)}
            className="input"
            placeholder="instagram, stories, verão2025"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Link href="/demands" className="btn-secondary flex-1 text-center">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading || !form.title.trim()}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : 'Criar Demanda'}
          </button>
        </div>
      </form>
    </div>
  );
}
