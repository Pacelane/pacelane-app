# Pacelane – Contexto do Produto

## Visão geral

Pacelane é um **assistente de IA para criação de conteúdo B2B**, hoje focado principalmente em **gerar posts para LinkedIn** a partir do **contexto real do usuário**.

O produto ajuda o usuário a transformar o que já acontece no dia a dia (conversas, materiais, anotações) em conteúdo publicável.

---

## Fluxos principais de criação de conteúdo

### 1. Criação ativa (via Content Editor)

Fluxo em que o usuário entra na plataforma e participa ativamente da criação:

- Usuário acessa o **Content Editor** na UI.
- Seleciona **contextos enviados via WhatsApp** (e/ou via Knowledge Base).
- Cria novos posts ou continua rascunhos existentes.
- **Edita os posts manualmente** antes de publicar.
- Tem **controle total e manual** sobre o que vai ser publicado.

Hoje, a publicação em si é **manual**: o usuário decide quando postar e pode marcar na plataforma que aquele conteúdo foi publicado.

### 2. Criação passiva (sugestões automáticas)

Fluxo em que o sistema trabalha para o usuário, respeitando o pacing configurado:

- O sistema analisa os **contextos do usuário** (especialmente WhatsApp, e no futuro demais fontes).
- Gera **sugestões de conteúdo** de forma automática.
- Hoje o envio dessas sugestões ainda é **acionado manualmente**, mas a arquitetura já aponta para automação.
- O **Spider Agent** é responsável por **gerar o conteúdo automaticamente**:
  - Usa posts anteriores do usuário para aprender estilo;
  - Usa inputs recentes de WhatsApp como matéria-prima.
- O usuário recebe as sugestões, pode **revisar, editar e então postar**.

O objetivo é o sistema **empurrar boas oportunidades de posts** nos dias certos, de acordo com o pacing configurado.

---

## Pacing e automação

- O usuário define um **pacing ideal** (ex.: “quero postar 3 vezes por semana, segunda, quarta e sexta”).
- A partir disso, o sistema busca garantir que:
  - Nesse conjunto de dias, o usuário receba **sugestões suficientes** para alcançar a meta (ex.: 3 posts/semana).
  - As sugestões respeitem **contexto recente** e **estilo do usuário**.
- A automação atua em duas frentes:
  - **Gatilhos em horários específicos** (ex.: horários de disparo de sugestões/conteúdo).
  - **Agentes de conteúdo** (como o Spider Agent) gerando textos que o usuário pode aproveitar com o mínimo de fricção.

Mesmo com automação forte, a **decisão final de publicar** permanece com o usuário, que continua marcando manualmente o que foi publicado.

---

## Canais de entrada de contexto

### 1. WhatsApp (via integração)

Hoje, o principal canal de captura de contexto é o **WhatsApp**, onde o usuário pode enviar:

- **Textos**
- **Links**
- **Áudios** (que podem ser transcritos)
- **Fotos**
- **Vídeos**
- **Arquivos/documentos**

Esses insumos formam a “matéria-prima” que a IA usa para gerar posts, tanto:
- No fluxo **ativo** (usuário escolhe os contextos no editor), quanto  
- No fluxo **passivo** (sugestões automáticas usando o que chegou pelo WhatsApp).

### 2. Input manual via Knowledge Base (UI)

Além do WhatsApp, o usuário pode **subir contexto manualmente pela UI**, via Knowledge Base, com a mesma lógica:

- Envia arquivos, textos e materiais diretamente pela plataforma.
- Esses conteúdos funcionam como **fonte adicional de contexto**, equivalente conceitualmente ao WhatsApp, mas com entrada **100% web**.

---

## Papel do usuário hoje

- **Sempre decide o que vai para o LinkedIn**:
  - Escolhe posts no editor.
  - Edita o que achar necessário.
  - Publica manualmente e marca como publicado na plataforma.
- Pode **aproveitar o melhor dos dois mundos**:
  - Quando quer controlar tudo: usa o **fluxo ativo**.
  - Quando quer ser provocado/estimulado: conta com o **fluxo passivo** (Spider Agent + pacing).

---

Este documento resume o contexto atual do Pacelane no MVP:  
um assistente de IA que transforma o cotidiano do usuário (especialmente o que passa pelo WhatsApp e pela Knowledge Base) em oportunidades claras de posts B2B para LinkedIn, combinando **criação ativa** com **criação passiva** guiada por pacing.


