# Configurar o Supabase

1. Crie um projeto em https://supabase.com.
2. Abra `SQL Editor > New query`.
3. Cole todo o conteúdo de `supabase-setup.sql` e clique em `Run`.
4. Abra `Authentication > Providers` e confirme que `Email` está ativo.
5. Abra `Authentication > Users > Add user`.
6. Crie uma conta para Henrique e outra para Vithoria. Marque o e-mail como confirmado.
7. Abra `Project Settings > Data API`.
8. Copie `Project URL` e `Publishable key`.
9. Cole os dois valores em `supabase-config.js`.
10. Envie as alterações para o GitHub e faça um novo deploy na Vercel.

Use apenas a chave pública `publishable` ou `anon`. Nunca publique a chave `service_role`.

Depois do primeiro login, a lembrança que já estava salva no navegador será migrada automaticamente para o Supabase. As fotos são comprimidas e armazenadas junto da lembrança na tabela; não é necessário configurar o Storage.
