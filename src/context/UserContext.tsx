import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { UserProfile, RolId, RolNombre } from '../types';

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  refetch: () => void;
  // Permission helpers
  isAdmin: boolean;
  isGerenciaOrAbove: boolean;
  isMarketingOrAbove: boolean;
  isCommunityOrAbove: boolean;
}

const UserContext = createContext<UserContextType>({
  profile: null,
  loading: true,
  refetch: () => {},
  isAdmin: false,
  isGerenciaOrAbove: false,
  isMarketingOrAbove: false,
  isCommunityOrAbove: false,
});

export const useUser = () => useContext(UserContext);

interface Props { children: React.ReactNode; userId: string; }

export const UserProvider: React.FC<Props> = ({ children, userId }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      let data: any = null;
      let error: any = null;
      
      const res = await supabase
        .from('usuarios')
        .select('id_usuario, nombre, apellido, correo, id_rol, roles(nombre_rol), telefono, whatsapp_session_name, whatsapp_phone')
        .eq('id_usuario', userId)
        .single();
        
      if (res.error && res.error.message.includes('column')) {
        // Fallback without whatsapp columns
        const fallback = await supabase
          .from('usuarios')
          .select('id_usuario, nombre, apellido, correo, id_rol, roles(nombre_rol)')
          .eq('id_usuario', userId)
          .single();
        data = fallback.data;
        error = fallback.error;
      } else {
        data = res.data;
        error = res.error;
      }

      if (error || !data) {
        // Si no hay perfil aún (ej: login con Google nuevo), por defecto es Cliente (rol 5)
        setProfile({
          id_usuario: userId,
          nombre: 'Cliente',
          apellido: '',
          correo: '',
          id_rol: 5 as RolId,
          nombre_rol: 'Cliente' as RolNombre,
          telefono: '',
          whatsapp_session_name: '',
          whatsapp_phone: '',
        });
      } else {
        const rolesData = (data as any).roles;
        setProfile({
          id_usuario: data.id_usuario,
          nombre: data.nombre,
          apellido: data.apellido,
          correo: data.correo,
          id_rol: data.id_rol as RolId,
          nombre_rol: (rolesData?.nombre_rol ?? 'Cliente') as RolNombre,
          telefono: data.telefono || '',
          whatsapp_session_name: data.whatsapp_session_name || '',
          whatsapp_phone: data.whatsapp_phone || '',
        });
      }
    } catch {
      // En caso de fallo total de red, asegurar que tengan perfil básico para no bloquear la app
      setProfile({
        id_usuario: userId,
        nombre: 'Invitado',
        apellido: '',
        correo: '',
        id_rol: 5 as RolId,
        nombre_rol: 'Cliente' as RolNombre,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchProfile();
  }, [userId]);

  const rol = profile?.id_rol ?? 99;

  return (
    <UserContext.Provider value={{
      profile,
      loading,
      refetch: fetchProfile,
      isAdmin:             rol === 1,
      isGerenciaOrAbove:   rol <= 2,
      isMarketingOrAbove:  rol <= 3,
      isCommunityOrAbove:  rol <= 4,
    }}>
      {children}
    </UserContext.Provider>
  );
};
