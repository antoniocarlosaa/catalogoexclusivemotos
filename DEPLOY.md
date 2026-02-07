# Guia de Deploy na Vercel - Exclusive Veículos

Este guia passo a passo ajudará você a colocar seu catálogo online usando a Vercel.

## Pré-requisitos
1.  Uma conta no [GitHub](https://github.com).
2.  Uma conta na [Vercel](https://vercel.com) (pode entrar com sua conta GitHub).
3.  Seu projeto estar funcionando localmente.

## Passo 1: Preparar o Código

1.  Abra seu terminal no VS Code.
2.  Certifique-se de que todas as suas alterações foram salvas.
3.  Execute os seguintes comandos para enviar seu código para o GitHub:

```bash
git add .
git commit -m "Preparando Exclusive Veículos para deploy"
git push
```

## Passo 2: Configurar na Vercel

1.  Acesse o painel da [Vercel](https://vercel.com/dashboard).
2.  Clique no botão **"Add New..."** e selecione **"Project"**.
3.  Na lista "Import Git Repository", encontre o seu repositório. Clique em **"Import"**.

## Passo 3: Configuração do Projeto (MUITO IMPORTANTE)

Na tela de configuração "Configure Project":

1.  **Project Name**: Digite `exclusive-veiculos` (ou o nome que preferir).
2.  **Framework Preset**: A Vercel deve detectar como **Vite**.
3.  **Root Directory**: 
    *   Clique em **Edit**.
    *   Selecione a pasta `catalogoexclusive` (onde está o arquivo `package.json`).
    *   Isso é **fundamental** para o build funcionar!

4.  **Environment Variables**:
    Copie as chaves do seu arquivo `.env.local` para cá:

    *   **Nome**: `VITE_SUPABASE_URL`
    *   **Valor**: `https://bpxdzuwrwptlcenugglr.supabase.co`
    *   Clique em **Add**.

    *   **Nome**: `VITE_SUPABASE_ANON_KEY`
    *   **Valor**: *(Copie a chave longa do seu arquivo .env.local)*
    *   Clique em **Add**.

## Passo 4: Deploy

1.  Clique em **"Deploy"**.
2.  Aguarde a Vercel construir o site.
3.  Se tudo der certo, você verá uma tela de comemoração! 🚀

---
Se tiver qualquer dúvida ou erro durante o processo, me avise!
