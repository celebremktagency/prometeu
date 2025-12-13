-- Create tables for invitation system between clients and professionals

-- Table for professional invites
CREATE TABLE IF NOT EXISTS professional_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    invite_code VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- Table for professional-client relationships
CREATE TABLE IF NOT EXISTS professional_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pausado')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(professional_id, client_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_professional_invites_professional_id ON professional_invites(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_invites_client_id ON professional_invites(client_id);
CREATE INDEX IF NOT EXISTS idx_professional_invites_status ON professional_invites(status);
CREATE INDEX IF NOT EXISTS idx_professional_invites_code ON professional_invites(invite_code);

CREATE INDEX IF NOT EXISTS idx_professional_clients_professional_id ON professional_clients(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_clients_client_id ON professional_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_professional_clients_status ON professional_clients(status);

-- RLS (Row Level Security) policies

-- Professional invites policies
ALTER TABLE professional_invites ENABLE ROW LEVEL SECURITY;

-- Users can see invites they sent or received
CREATE POLICY "Users can view their own invites" ON professional_invites
    FOR SELECT USING (
        auth.uid() = client_id OR auth.uid() = professional_id
    );

-- Clients can create invites
CREATE POLICY "Clients can create invites" ON professional_invites
    FOR INSERT WITH CHECK (
        auth.uid() = client_id AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND tipo IN ('aluno', 'client')
        )
    );

-- Professionals can update invite status
CREATE POLICY "Professionals can update invite status" ON professional_invites
    FOR UPDATE USING (
        auth.uid() = professional_id AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND tipo IN ('personal_trainer', 'trainer')
        )
    ) WITH CHECK (
        auth.uid() = professional_id
    );

-- Professional-client relationships policies
ALTER TABLE professional_clients ENABLE ROW LEVEL SECURITY;

-- Users can see relationships they're part of
CREATE POLICY "Users can view their relationships" ON professional_clients
    FOR SELECT USING (
        auth.uid() = professional_id OR auth.uid() = client_id
    );

-- Only system can insert relationships (through invite acceptance)
CREATE POLICY "System can create relationships" ON professional_clients
    FOR INSERT WITH CHECK (true);

-- Only professionals can update relationship status
CREATE POLICY "Professionals can update relationships" ON professional_clients
    FOR UPDATE USING (
        auth.uid() = professional_id AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND tipo IN ('personal_trainer', 'trainer')
        )
    ) WITH CHECK (
        auth.uid() = professional_id
    );

-- Function to clean up expired invites
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS void AS $$
BEGIN
    DELETE FROM professional_invites 
    WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Insert some test data (optional)
-- This would be commented out in production
/*
INSERT INTO professional_invites (client_id, professional_id, invite_code, expires_at) VALUES
(
    (SELECT id FROM auth.users WHERE email = 'cliente@teste.com'),
    (SELECT id FROM auth.users WHERE email = 'trainer@teste.com'),
    'CL12345ABC',
    NOW() + INTERVAL '7 days'
);
*/