-- Desabilitar temporariamente o trigger durante a correção
ALTER TABLE profiles DISABLE TRIGGER trigger_validate_user_creation;

-- Corrigir todos os usuários que estão com flag incorretamente ativa
UPDATE profiles 
SET requires_password_change = false 
WHERE requires_password_change = true;

-- Reabilitar o trigger
ALTER TABLE profiles ENABLE TRIGGER trigger_validate_user_creation;