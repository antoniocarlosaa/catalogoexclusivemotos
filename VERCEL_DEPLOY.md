# Guia de Correção de Deploy na Vercel

## Problema: Projetos Duplicados
Você notou que existem 3 projetos "exclusivemotos" na Vercel. Isso acontece quando você tenta fazer deploy (enviar o site) sem que o seu computador saiba qual é o "projeto oficial".

A Vercel pensa: "Ah, ele quer um novo site!", e cria outro.

## Solução Passo a Passo

### 1. Limpar a Bagunça (No Site da Vercel)
1. Acesse o **Dashboard da Vercel** (vercel.com).
2. Identifique os projetos duplicados.
3. Mantenha apenas o **OFICIAL** (o que tem o domínio certo ou o mais recente).
4. Delete os outros (Vá em **Settings** -> **General** -> Role até o fim -> **Delete Project**).

### 2. Vincular seu Computador ao Projeto Certo
No seu terminal (dentro da pasta do projeto), rode este comando para "ensinar" ao seu computador qual é o projeto correto:

```powershell
npx vercel link
```

Ele vai fazer algumas perguntas:
1. **Set up "catalogoexclusive"?** -> Responda **Y** (Sim).
2. **Which scope do you want to deploy to?** -> Selecione sua conta (dê Enter).
3. **Link to existing project?** -> Responda **Y** (Sim).
4. **What's the name of your existing project?** -> Digite **EXATAMENTE** o nome do projeto que sobrou lá no painel da Vercel (ex: `exclusivemotos-v2`).

### 3. Fazer o Deploy Oficial
Agora que está vinculado, sempre que quiser atualizar, use este comando:

```powershell
npx vercel --prod
```

Isso vai enviar as alterações para o MESMO projeto, sem criar novos.

## Sobre o Erro de "Next/Server"
Como o build funcionou no seu computador, o erro pode ter sumido. Ao fazer o passo 3 acima, fique de olho no terminal. Se der erro vermelho, copie e me mande aqui!
