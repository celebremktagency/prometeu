export interface User {
 id: string
 user_id: string
 nome: string
 email: string
 tipo: 'aluno' | 'personal_trainer' | 'fisioterapeuta' | 'nutricionista' | 'medico'
}

export interface Dor {
 id: string
 user_id: string
 intensidade: number
 localizacao: string
 observacoes?: string
 data_registro: string
}

export interface Treino {
 id: string
 nome: string
 descricao?: string
 user_id: string
 created_at: string
}

export interface Exercicio {
 id: string
 nome: string
 descricao?: string
 grupo_muscular: string
 equipamento?: string
}