# Henrique & Vithoria

Um diário romântico e interativo criado para guardar a história do casal desde 05 de junho de 2026.

## Abrir o site

Com Node.js instalado:

```powershell
npm start
```

Depois, acesse `http://localhost:3000`.

Também é possível abrir o arquivo `index.html` diretamente, mas o servidor local oferece a experiência mais confiável.

## Publicar na Vercel

O projeto já possui `vercel.json`. Ao importar o repositório:

- Framework Preset: `Other`
- Root Directory: deixe vazio se estes arquivos estiverem na raiz do repositório
- Build Command: deixe vazio
- Output Directory: deixe vazio

Depois de enviar alterações ao GitHub, faça um novo deploy na Vercel sem reutilizar o cache.

## Novas memórias

O formulário usa Supabase para sincronizar textos e fotos entre os aparelhos.

1. Crie um projeto em `supabase.com`.
2. Abra o SQL Editor, cole o conteúdo de `supabase-setup.sql` e execute.
3. Em `Authentication > Providers`, mantenha o provedor Email ativo.
4. Em `Authentication > Users > Add user`, crie uma conta para cada um de vocês.
5. Copie a Project URL e a chave Publishable em `supabase-config.js`.
6. Envie os arquivos atualizados ao GitHub e faça o redeploy na Vercel.

Nunca coloque a chave `service_role` no site. Use somente a chave pública `publishable` ou `anon`.

As fotos são comprimidas antes do envio e armazenadas na própria tabela `memories`; não é necessário criar um bucket no Supabase Storage.

Para tornar o mural público em um projeto já configurado, execute `supabase-tornar-mural-publico.sql`. Visitantes podem visualizar; somente as contas autorizadas podem inserir ou excluir.
