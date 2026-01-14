import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string | null;
  name: string;
  role: 'parent' | 'child';
  pin_code: string | null;
  color: string;
  avatar_emoji: string;
  created_at: string;
}

export interface CreateMemberInput {
  name: string;
  role: 'parent' | 'child';
  pin_code?: string;
  color?: string;
  avatar_emoji?: string;
}

export function useFamilyMembers() {
  const { family } = useAuth();

  return useQuery({
    queryKey: ['family-members', family?.id],
    queryFn: async () => {
      if (!family) return [];

      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', family.id)
        .order('role', { ascending: true })
        .order('name');

      if (error) throw error;
      return data as FamilyMember[];
    },
    enabled: !!family,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  const { family } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateMemberInput) => {
      if (!family) throw new Error('No family found');

      const { data, error } = await supabase
        .from('family_members')
        .insert({
          ...input,
          family_id: family.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateMemberInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('family_members')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('family_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
    },
  });
}
