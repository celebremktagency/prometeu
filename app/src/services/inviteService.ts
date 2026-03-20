import { supabase } from './supabaseClient';

export interface ProfessionalInvite {
 id: string;
 client_id: string;
 professional_id: string;
 invite_code: string;
 status: 'pending' | 'accepted' | 'rejected';
 created_at: string;
 expires_at: string;
 accepted_at?: string;
}

export interface InviteCode {
 code: string;
 type: 'client_to_professional' | 'professional_to_client';
 created_by: string;
 expires_at: string;
}

class InviteService {
 
 async generateProfessionalCode(professionalId: string): Promise<string> {
  // Generate a more unique code for the professional
  // Use last 4 characters of UUID + 2 random chars
  const idSuffix = professionalId.replace(/-/g, '').slice(-4).toUpperCase();
  const randomChars = Math.random().toString(36).substring(2, 4).toUpperCase();
  const code = `PT${idSuffix}${randomChars}`;
  return code;
 }

 async generateClientInviteCode(clientId: string): Promise<string> {
  // Generate a unique invite code for client to invite professional
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `CL${clientId.slice(-4).toUpperCase()}${randomSuffix}`;
  return code;
 }

 async sendProfessionalInvite(clientId: string, professionalCode: string): Promise<void> {
  try {
   // Find professional by code
   const professional = await this.findProfessionalByCode(professionalCode);

   // Check if invitation already exists
   const { data: existingInvite, error: checkError } = await supabase
    .from('professional_invites')
    .select('*')
    .eq('client_id', clientId)
    .eq('trainer_id', professional.user_id)
    .eq('status', 'pending')
    .single();

   if (existingInvite) {
    throw new Error('Você já enviou um convite para este personal trainer');
   }

   // Create invitation
   const inviteCode = await this.generateClientInviteCode(clientId);
   const expiresAt = new Date();
   expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

   const { error: insertError } = await supabase
    .from('professional_invites')
    .insert({
     client_id: clientId,
     trainer_id: professional.user_id,
     invite_code: inviteCode,
     status: 'pending',
     expires_at: expiresAt.toISOString(),
    });

   if (insertError) {
    throw new Error('Erro ao enviar convite: ' + insertError.message);
   }

   // Here you would typically send a notification to the professional
   console.log(`Convite enviado para ${professional.nome}`);

  } catch (error: any) {
   throw new Error(error.message || 'Erro ao enviar convite');
  }
 }

 async acceptProfessionalInvite(inviteId: string, professionalId: string): Promise<void> {
  try {
   // Update invite status
   const { error: updateError } = await supabase
    .from('professional_invites')
    .update({
     status: 'accepted',
     accepted_at: new Date().toISOString(),
    })
    .eq('id', inviteId)
    .eq('trainer_id', professionalId);

   if (updateError) {
    throw new Error('Erro ao aceitar convite: ' + updateError.message);
   }

   // Get invite details to create relationship
   const { data: invite, error: inviteError } = await supabase
    .from('professional_invites')
    .select('client_id, trainer_id')
    .eq('id', inviteId)
    .single();

   if (inviteError || !invite) {
    throw new Error('Convite não encontrado');
   }

   // Create professional-client relationship
   const { error: relationError } = await supabase
    .from('professional_clients')
    .insert({
     trainer_id: invite.trainer_id,
     client_id: invite.client_id,
     started_at: new Date().toISOString(),
    });

   if (relationError) {
    // If relationship already exists, just ignore the error
    console.log('Relationship might already exist:', relationError.message);
   }

  } catch (error: any) {
   throw new Error(error.message || 'Erro ao aceitar convite');
  }
 }

 async rejectProfessionalInvite(inviteId: string, professionalId: string): Promise<void> {
  try {
   const { error } = await supabase
    .from('professional_invites')
    .update({ status: 'rejected' })
    .eq('id', inviteId)
    .eq('trainer_id', professionalId);

   if (error) {
    throw new Error('Erro ao rejeitar convite: ' + error.message);
   }

  } catch (error: any) {
   throw new Error(error.message || 'Erro ao rejeitar convite');
  }
 }

 async getPendingInvites(professionalUserId: string): Promise<ProfessionalInvite[]> {
  try {
   const { data, error } = await supabase
    .from('professional_invites')
    .select('*')
    .eq('trainer_id', professionalUserId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

   if (error) {
    throw new Error('Erro ao carregar convites: ' + error.message);
   }

   if (!data || data.length === 0) return [];

   // Buscar dados dos clientes separadamente
   const clientIds = data.map(d => d.client_id);
   const { data: clients } = await supabase
    .from('user_profiles')
    .select('user_id, nome, email')
    .in('user_id', clientIds);

   return data.map(invite => ({
    ...invite,
    client: clients?.find(c => c.user_id === invite.client_id) || null
   }));

  } catch (error: any) {
   throw new Error(error.message || 'Erro ao carregar convites');
  }
 }

 async getSentInvites(clientId: string): Promise<ProfessionalInvite[]> {
  try {
   const { data, error } = await supabase
    .from('professional_invites')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

   if (error) {
    throw new Error('Erro ao carregar convites enviados: ' + error.message);
   }

   if (!data || data.length === 0) return [];

   // Buscar dados dos profissionais separadamente
   const trainerIds = data.map(d => d.trainer_id);
   const { data: trainers } = await supabase
    .from('user_profiles')
    .select('user_id, nome, email')
    .in('user_id', trainerIds);

   return data.map(invite => ({
    ...invite,
    professional: trainers?.find(t => t.user_id === invite.trainer_id) || null
   }));

  } catch (error: any) {
   throw new Error(error.message || 'Erro ao carregar convites enviados');
  }
 }

 async findProfessionalByCode(code: string): Promise<any> {
  try {
   // Validate code input
   if (!code || typeof code !== 'string' || code.trim().length === 0) {
    throw new Error('Código inválido');
   }
   
   const cleanCode = code.trim().toUpperCase();
   
   // Validate code format (should start with PT and be 8 chars)
   if (!cleanCode.startsWith('PT') || cleanCode.length !== 8) {
    throw new Error('Formato de código inválido. Use formato PTXXXXXX');
   }
   
   // Extract suffix from code (remove PT prefix)
   const codeSuffix = cleanCode.replace('PT', '');
   
   // Get all personal trainers (check both tipo values for compatibility)
   const { data, error } = await supabase
    .from('user_profiles')
    .select('id, user_id, nome, email, created_at, tipo')
    .or('tipo.eq.personal_trainer,tipo.eq.profissional')
    .eq('ativo', true);

   if (error) {
    console.error('Database error:', error);
    throw new Error('Erro ao buscar personal trainer: ' + error.message);
   }

   if (!data || data.length === 0) {
    throw new Error('Nenhum personal trainer ativo encontrado no sistema');
   }

   // Generate codes for all professionals and find match
   let matchingProfessional = null;
   
   for (const prof of data) {
    try {
     const profCode = await this.generateProfessionalCode(prof.id || prof.user_id);
     const profSuffix = profCode.replace('PT', '');
     
     if (profSuffix === codeSuffix) {
      matchingProfessional = prof;
      break;
     }
    } catch (error) {
     console.log('Error generating code for professional:', prof.id);
    }
   }

   if (!matchingProfessional) {
    // Fallback: try simpler matching with user_id/id suffix
    const matchByIdSuffix = data.find(prof => {
     const profId = (prof.id || prof.user_id || '').toString().replace(/-/g, '').slice(-4).toUpperCase();
     return codeSuffix.startsWith(profId);
    });
    
    if (matchByIdSuffix) {
     matchingProfessional = matchByIdSuffix;
    }
   }

   if (!matchingProfessional) {
    throw new Error('Personal trainer não encontrado com este código. Verifique se o código está correto.');
   }

   console.log('Personal trainer encontrado:', matchingProfessional.nome);
   return matchingProfessional;

  } catch (error: any) {
   console.error('Error in findProfessionalByCode:', error);
   throw new Error(error.message || 'Erro ao buscar personal trainer');
  }
 }

 async getMyClients(professionalId: string): Promise<any[]> {
  try {
   const { data: connections, error } = await supabase
    .from('professional_clients')
    .select('*')
    .eq('trainer_id', professionalId)
    .order('started_at', { ascending: false });

   if (error) {
    throw new Error('Erro ao carregar clientes: ' + error.message);
   }

   if (!connections || connections.length === 0) return [];

   const clientIds = connections.map(c => c.client_id);
   const { data: clients } = await supabase
    .from('user_profiles')
    .select('user_id, nome, email, created_at')
    .in('user_id', clientIds);

   return connections.map(conn => {
    const client = clients?.find(c => c.user_id === conn.client_id);
    return {
     ...client,
     relationship_started: conn.started_at,
    };
   });

  } catch (error: any) {
   throw new Error(error.message || 'Erro ao carregar clientes');
  }
 }

 async getMyProfessional(clientId: string): Promise<any | null> {
  try {
   const { data: connection, error } = await supabase
    .from('professional_clients')
    .select('*')
    .eq('client_id', clientId)
    .single();

   if (error) {
    if (error.code === 'PGRST116') {
     return null;
    }
    throw new Error('Erro ao carregar personal trainer: ' + error.message);
   }

   if (!connection) return null;

   const { data: professional } = await supabase
    .from('user_profiles')
    .select('user_id, nome, email, created_at')
    .eq('user_id', connection.trainer_id)
    .single();

   return {
    ...professional,
    relationship_started: connection.started_at,
   };

  } catch (error: any) {
   throw new Error(error.message || 'Erro ao carregar personal trainer');
  }
 }

 async connectWithTrainer(code: string): Promise<{ success: boolean; error?: string }> {
  try {
   // Get current user
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
   }

   // Find professional by code
   const professional = await this.findProfessionalByCode(code);
   
   // Check if already connected
   const existing = await this.getMyProfessional(user.id);
   if (existing) {
    return { success: false, error: 'Você já está conectado a um personal trainer' };
   }

   // Create professional-client relationship using user_id
   const { error: relationError } = await supabase
    .from('professional_clients')
    .insert({
     trainer_id: professional.user_id,
     client_id: user.id,
     started_at: new Date().toISOString(),
    });

   if (relationError) {
    // Check if it's a duplicate error
    if (relationError.code === '23505') { // Unique constraint violation
     return { success: false, error: 'Conexão já existe com este personal' };
    }
    return { success: false, error: 'Erro ao criar conexão: ' + relationError.message };
   }

   return { success: true };

  } catch (error: any) {
   return { success: false, error: error.message || 'Erro ao conectar com personal trainer' };
  }
 }
}

export const inviteService = new InviteService();