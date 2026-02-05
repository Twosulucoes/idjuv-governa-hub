-- Corrigir o DEFAULT da coluna para FALSE
ALTER TABLE profiles 
ALTER COLUMN requires_password_change SET DEFAULT false;