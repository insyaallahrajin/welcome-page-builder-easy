
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        // If no role found, default to parent
        if (error.code === 'PGRST116') {
          setRole('parent');
        } else {
          throw error;
        }
      } else {
        setRole(data?.role || 'parent');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole('parent'); // Default to parent if error
    } finally {
      setLoading(false);
    }
  };

  return { role, loading, isAdmin: role === 'admin' };
};
