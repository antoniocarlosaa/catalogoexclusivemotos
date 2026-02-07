# GUIA COMPLETO: Como Duplicar o Catálogo para Outra Loja

Este guia foi atualizado para tornar o processo de revenda/duplicação MUITO mais rápido.
O código agora está preparado para "White Label" (Rótulo Branco), ou seja, fácil de mudar a marca.

---

## 🚀 1. Copiar o Projeto (No Computador)
1.  Vá até a pasta onde este projeto está salvo.
2.  **Copie** a pasta inteira `catalogoalfamotos`.
3.  **Cole** e renomeie para o nome da nova loja (ex: `catalogo-império-carros`).
4.  Abra essa nova pasta no **VS Code**.

## 🧹 2. Limpar o Ambiente (Reset)
Para começar do zero sem histórico da loja anterior:
1.  Apague a pasta `node_modules`.
2.  Apague a pasta `.git` (Isso remove o vínculo com o GitHub antigo).
3.  No terminal do VS Code, rode:
    ```bash
    npm install
    ```

## 🎨 3. Alterar Marca e Textos (AGORA MUITO FÁCIL!)
Não precisa caçar textos em vários arquivos. Tudo está em um lugar só.

1.  Abra o arquivo: `src/config/brand.ts`.
2.  Altere os dados da nova loja:
    ```typescript
    export const BRAND = {
      name: {
        first: 'IMPÉRIO',    // Primeira parte do nome
        second: 'CARROS',    // Segunda parte (geralmente colorida)
        full: 'IMPÉRIO CARROS'
      },
      slogan: 'A melhor seleção da cidade',
      contact: {
        whatsapp: '98 900000000', // Telefone que aparece no rodapé
        copyright: 'IMPÉRIO SOLUÇÕES' // Nome do seu cliente ou sua agência
      },
      colors: {
        highlight: 'text-blue-600' // Classe de cor do Tailwind para destaques (ex: text-blue-600)
      }
    };
    ```

## 🖌️ 4. Alterar Cores Principais (Tema)
As cores globais (botões, barras de rolagem) são definidas no arquivo principal.

1.  Abra o arquivo `index.html`.
2.  Procure por `tailwind.config`.
3.  Mude a cor "gold" (que usamos como primária) para a cor da nova marca:
    ```javascript
    gold: {
        DEFAULT: '#2563EB', // <--- Coloque o código HEX da cor nova aqui (ex: Azul)
        light: '#60A5FA',   // Uma versão mais clara
        dark: '#1E40AF',    // Uma versão mais escura
    },
    ```

## 🗄️ 5. Novo Banco de Dados (Supabase)
Cada cliente PRECISA do seu próprio banco de dados.

1.  Crie um novo projeto em [supabase.com](https://supabase.com).
2.  Vá em **Project Settings > API**.
3.  Copie a `Project URL` e a `anon public key`.
4.  No VS Code, abra o arquivo `.env.local` e cole as novas chaves.
5.  **Rodar o Script de Instalação**:
    - Abra o arquivo `SUPABASE_SETUP.md` (ou pegue os SQLs da pasta).
    - Vá no **SQL Editor** do novo Supabase.
    - Rode o script para criar as tabelas (`vehicles`, `settings`, `site_stats`, etc).
    - **IMPORTANTE:** Rode também o script do contador de visitas (`FIX_VISIT_COUNTER.sql`) para ativar essa função.

## 🚀 6. Publicar (Deploy)
1.  Crie um novo repositório no GitHub.
2.  No terminal do VS Code:
    ```bash
    git init
    git add .
    git commit -m "Setup inicial Loja X"
    git branch -M main
    git remote add origin https://github.com/SEU_USUARIO/NOVA-LOJA.git
    git push -u origin main
    ```
3.  Importe o projeto na Vercel e pronto!

---
**DICA DE OURO**: Se quiser cobrar mensalidade, mantenha o acesso ao Supabase (banco de dados) apenas com você. Assim você controla o acesso do cliente.
