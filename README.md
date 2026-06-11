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
- Build Command: detectado automaticamente como `npm run build`
- Output Directory: detectado automaticamente como `dist`

Depois de enviar alterações ao GitHub, faça um novo deploy na Vercel sem reutilizar o cache.

## Novas memórias

O formulário no "Cantinho da saudade" salva textos e imagens no armazenamento local do navegador. O botão **Baixar nossas memórias** cria uma cópia de segurança em JSON, e **Restaurar memórias** recupera essa cópia.
