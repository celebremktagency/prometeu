-- ==========================================
-- SCRIPT PARA NOVAS FUNCIONALIDADES DO APP
-- ==========================================

-- 1. TABELA DE CONFIGURAÇÕES DO USUÁRIO
CREATE TABLE IF NOT EXISTS user_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    push_notifications boolean DEFAULT true,
    email_notifications boolean DEFAULT true,
    workout_reminders boolean DEFAULT true,
    pain_tracking_reminders boolean DEFAULT true,
    data_sharing boolean DEFAULT false,
    language varchar(5) DEFAULT 'pt-BR',
    theme varchar(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id)
);

-- 2. TABELA DE NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type varchar(20) DEFAULT 'general' CHECK (type IN ('general', 'workout', 'pain', 'payment', 'community', 'system')),
    is_read boolean DEFAULT false,
    action_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. TABELA DE AVALIAÇÕES
CREATE TABLE IF NOT EXISTS ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES users(id) ON DELETE CASCADE,
    professional_id uuid REFERENCES users(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review text,
    workout_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. TABELA DE FEEDBACK DE TREINOS
CREATE TABLE IF NOT EXISTS workout_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    workout_id uuid,
    difficulty_rating integer CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    enjoyment_rating integer CHECK (enjoyment_rating >= 1 AND enjoyment_rating <= 5),
    fatigue_level integer CHECK (fatigue_level >= 1 AND fatigue_level <= 10),
    completion_percentage integer DEFAULT 100 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. TABELA DE OBJETIVOS DO USUÁRIO
CREATE TABLE IF NOT EXISTS user_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    goal_type varchar(20) NOT NULL CHECK (goal_type IN ('weight_loss', 'muscle_gain', 'strength', 'endurance', 'flexibility', 'pain_reduction')),
    target_value numeric(10,2),
    current_value numeric(10,2) DEFAULT 0,
    unit varchar(10),
    target_date date,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 6. TABELA DE AVALIAÇÃO DE SAÚDE
CREATE TABLE IF NOT EXISTS health_assessments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    age integer,
    weight numeric(5,2),
    height numeric(5,2),
    activity_level varchar(20) CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    medical_conditions text[],
    medications text[],
    exercise_limitations text[],
    previous_injuries text[],
    fitness_goals text[],
    created_at timestamp with time zone DEFAULT now()
);

-- 7. TABELA DE PLANOS/ASSINATURAS
CREATE TABLE IF NOT EXISTS subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(50) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    billing_period varchar(20) NOT NULL CHECK (billing_period IN ('monthly', 'quarterly', 'yearly')),
    features text[],
    max_clients integer,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- 8. TABELA DE RELATÓRIOS DE PROGRESSO
CREATE TABLE IF NOT EXISTS progress_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    report_type varchar(20) NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'custom')),
    start_date date NOT NULL,
    end_date date NOT NULL,
    workouts_completed integer DEFAULT 0,
    total_workout_time_minutes integer DEFAULT 0,
    pain_reduction_percentage numeric(5,2),
    weight_change numeric(5,2),
    strength_improvement numeric(5,2),
    goals_achieved text[],
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- 9. TABELA DE FAQ
CREATE TABLE IF NOT EXISTS faqs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category varchar(50) NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- 10. TABELA DE TICKETS DE SUPORTE
CREATE TABLE IF NOT EXISTS support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    subject text NOT NULL,
    description text NOT NULL,
    category varchar(50) CHECK (category IN ('technical', 'billing', 'general', 'bug_report', 'feature_request')),
    status varchar(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority varchar(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to uuid,
    resolution_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone
);

-- 11. TABELA DE BACKUP/EXPORT DE DADOS
CREATE TABLE IF NOT EXISTS data_exports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    export_type varchar(20) NOT NULL CHECK (export_type IN ('full', 'workouts', 'progress', 'pain_logs')),
    file_format varchar(10) NOT NULL CHECK (file_format IN ('json', 'csv', 'pdf')),
    status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url text,
    file_size_bytes bigint,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- INSERIR DADOS INICIAIS
-- ==========================================

-- Inserir planos de assinatura padrão
INSERT INTO subscription_plans (name, description, price, billing_period, features, max_clients) VALUES
('Gratuito', 'Plano básico com funcionalidades limitadas', 0.00, 'monthly', ARRAY['3 treinos por mês', 'Tracking básico de dor'], 0),
('Personal Básico', 'Para personal trainers iniciantes', 29.90, 'monthly', ARRAY['Até 20 clientes', 'Criação de treinos', 'Relatórios básicos'], 20),
('Personal Pro', 'Para personal trainers estabelecidos', 59.90, 'monthly', ARRAY['Clientes ilimitados', 'Relatórios avançados', 'Análise de dados'], 999),
('Aluno Premium', 'Acesso completo para alunos', 19.90, 'monthly', ARRAY['Treinos ilimitados', 'Análise de progresso', 'Suporte priority'], 0);

-- Inserir FAQs iniciais
INSERT INTO faqs (category, question, answer, order_index) VALUES
('Geral', 'Como funciona o aplicativo?', 'O Prometheus é uma plataforma que conecta alunos e personal trainers, oferecendo ferramentas para tracking de treinos e monitoramento de dor.', 1),
('Geral', 'Posso usar sem personal trainer?', 'Sim! Você pode usar o app como aluno independente com treinos pré-definidos e tracking de progresso.', 2),
('Pagamento', 'Como alterar meu plano?', 'Acesse Perfil > Configurações > Planos e Assinatura para alterar seu plano a qualquer momento.', 1),
('Pagamento', 'Como cancelar minha assinatura?', 'Você pode cancelar sua assinatura em Perfil > Configurações > Planos e Assinatura. O acesso continuará até o fim do período pago.', 2),
('Técnico', 'Como sincronizar meus dados?', 'Os dados são sincronizados automaticamente. Para forçar sincronização, vá em Configurações > Backup e Sincronização.', 1),
('Técnico', 'O app funciona offline?', 'Funcionalidades básicas como tracking de treinos funcionam offline, mas a sincronização requer conexão à internet.', 2);

-- ==========================================
-- ÍNDICES PARA PERFORMANCE
-- ==========================================

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Índices para avaliações
CREATE INDEX IF NOT EXISTS idx_ratings_professional ON ratings(professional_id);
CREATE INDEX IF NOT EXISTS idx_ratings_client ON ratings(client_id);

-- Índices para feedback de treinos
CREATE INDEX IF NOT EXISTS idx_workout_feedback_user ON workout_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_feedback_workout ON workout_feedback(workout_id);

-- Índices para objetivos
CREATE INDEX IF NOT EXISTS idx_user_goals_user_active ON user_goals(user_id, is_active);

-- Índices para relatórios de progresso
CREATE INDEX IF NOT EXISTS idx_progress_reports_user ON progress_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_reports_date ON progress_reports(start_date, end_date);

-- Índices para tickets de suporte
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- ==========================================
-- FUNÇÕES E TRIGGERS
-- ==========================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- RLS (ROW LEVEL SECURITY)
-- ==========================================

-- Habilitar RLS para todas as tabelas
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança - usuários só podem ver seus próprios dados
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view ratings" ON ratings FOR SELECT USING (client_id = auth.uid() OR professional_id = auth.uid());
CREATE POLICY "Users can insert own ratings" ON ratings FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can view own workout feedback" ON workout_feedback FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own workout feedback" ON workout_feedback FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own workout feedback" ON workout_feedback FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own goals" ON user_goals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own goals" ON user_goals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own goals" ON user_goals FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own health assessments" ON health_assessments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own health assessments" ON health_assessments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own health assessments" ON health_assessments FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own progress reports" ON progress_reports FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own progress reports" ON progress_reports FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own support tickets" ON support_tickets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own support tickets" ON support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own support tickets" ON support_tickets FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own data exports" ON data_exports FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own data exports" ON data_exports FOR INSERT WITH CHECK (user_id = auth.uid());

-- Políticas para tabelas públicas (FAQs e planos)
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view FAQs" ON faqs FOR SELECT USING (is_active = true);

-- ==========================================
-- COMENTÁRIOS DAS TABELAS
-- ==========================================

COMMENT ON TABLE user_settings IS 'Configurações personalizadas do usuário';
COMMENT ON TABLE notifications IS 'Sistema de notificações do aplicativo';
COMMENT ON TABLE ratings IS 'Avaliações entre clientes e profissionais';
COMMENT ON TABLE workout_feedback IS 'Feedback detalhado sobre treinos realizados';
COMMENT ON TABLE user_goals IS 'Objetivos e metas dos usuários';
COMMENT ON TABLE health_assessments IS 'Avaliação inicial de saúde dos usuários';
COMMENT ON TABLE subscription_plans IS 'Planos de assinatura disponíveis';
COMMENT ON TABLE progress_reports IS 'Relatórios de progresso dos usuários';
COMMENT ON TABLE faqs IS 'Perguntas frequentes do sistema';
COMMENT ON TABLE support_tickets IS 'Tickets de suporte ao cliente';
COMMENT ON TABLE data_exports IS 'Histórico de exportações de dados do usuário';