# Loco Chat

Loco Chat é uma interface web leve para visualizar, interagir e gerenciar chats de streamers da plataforma Loco, com recursos avançados como cópia de perfis (ao clicar em ⚡) , envio de mensagens com qualquer nome de usuário, painel de stickers e configuração dinâmica de credenciais.

> **Atenção:** A funcionalidade de envio de stickers ainda está em desenvolvimento (TODO).

Visual do chat:
<br>
![image](https://github.com/user-attachments/assets/4b207494-17e2-4d8c-9677-e87a0983eeda)

## Recursos

- Visualização em tempo real do chat de qualquer streamer Loco.
- Envio de mensagens autenticadas.
- Cópia rápida de perfis de usuários do chat.
- Painel de stickers do streamer (envio de stickers: em desenvolvimento).
- Configuração segura de credenciais via modal ou arquivo `.env`.
- Interface responsiva e moderna.
- **Ações dos moderadores:** exibe quando um moderador entra ou sai do chat.
- **Mensagens de moderadores protegidas:** caso um moderador delete uma mensagem, ela permanece visível no chat.
- **Contador ao vivo de moderadores online:** mostra em tempo real quantos moderadores estão presentes no chat.

## Requisitos

- Navegador moderno (Chrome, Firefox, Edge, etc).
- Não requer backend, instalação de dependências ou build.

## Instalação

1. **Clone ou baixe este repositório:**
   ```sh
   git clone https://github.com/lennix1337/locoChat.git
   ```
   ou baixe o ZIP e extraia.

2. **Crie um arquivo `.env` na raiz do projeto contendo seu UID:**  
   ```
   UID=SEU_UID_AQUI
   AUTHORIZATION=seu_token_de_autorizacao
   X_CLIENT_ID=seu_client_id
   X_CLIENT_SECRET=seu_client_secret
   ```
   > **Nunca compartilhe ou publique seu `.env`. O arquivo já está listado no `.gitignore` e não será versionado.

3. **Abra o arquivo `index.html` no navegador.**

> **Atenção:** Para enviar mensagens, é obrigatório definir seu UID no arquivo `.env` (linha `UID=SEU_UID_AQUI`).
- Clique duas vezes ou arraste para uma janela do navegador.

> **Nota:** Você pode escolher qualquer nome de usuário ao utilizar o projeto, incluindo nomes com emojis e qualquer quantidade de caracteres. No entanto, lembre-se: banimentos e timeouts sempre estarão vinculados ao seu UID, independentemente do nome escolhido ou copiado.

## Como obter seus tokens de authorization e client

1. Acesse a plataforma Loco e faça login normalmente.
2. Abra a aba **Network** (Rede) nas ferramentas de desenvolvedor do navegador (F12).
3. Interaja normalmente com o chat.
4. Utilize o filtro para localizar uma requisição cuja URL contenha `get=true` (normalmente relacionada ao recebimento de mensagens do chat).
5. Clique nessa requisição e, na seção de **Headers** (Cabeçalhos), localize os valores de:
   - `authorization`
   - `x-client-id`
   - `x-client-secret`
6. Copie esses valores e preencha no arquivo `.env` ou diretamente no modal de configurações do Loco Chat.
## Como encontrar seu UID

Para configurar o campo UID, você deve localizá-lo em uma resposta da API de chat da Loco. O UID é retornado junto com as demais informações do chat, mas para encontrá-lo você precisa identificar uma mensagem enviada por você mesmo no array `chats` da resposta.

**Passos para encontrar seu UID:**

1. Envie uma mensagem qualquer no chat da Loco.
2. No painel de desenvolvedor do navegador (F12), localize a requisição de chat (a mesma usada para obter os tokens).
3. No JSON de resposta, percorra o array `chats`.
4. Procure pelo objeto onde o campo `profile.username` corresponde ao seu nome de usuário.
5. O valor do campo `profile.uid` dentro desse objeto é o seu UID.

**Exemplo prático:**

```json
{"acu":19792,"chats":[{"id":"1744428678341-0","data":{"chat_text_color":"#FFFFFF","chat_text_weight":700,"client_msg_time":1744428677985,"deviceId":"0E80E2E3-1219-4318-8D60-2B792F116640-C2PKOD2CG6","message":"","moderator_type":0,"msgId":"","msg_time":1744428678190,"profile":{"avatar":"https://static.getloconow.com/loco-avatars/b954c1834d1f4ce9b3706e0c902e738a.png","color":"","text_color":"#F5D76E","text_weight":700,"uid":"C2PKOD2CG6","username":"jonatanseco"},"sticker":{"amount":10,"background_color":"#2B8756","collapse_after":10000,"created_at":"2025-01-12T20:19:22Z","currency_type":10,"hPos":2,"image_url":"https://static.getloconow.com/stickers/81a6cbe0-d122-11ef-98ee-15eedadba371.json","isSelected":true,"is_animated":true,"sticker_id":"b3a48dcf-7f03-43be-8ba7-6992eb507c87","sticker_type":4,"tabName":"GOLD","tab_key":20,"updated_at":"2025-01-12T20:19:22Z","vPos":6},"stream_uid":"f0704f39-1a61-40a8-abd6-f3b732ca0b25","type":4}},{"id":"1744428679931-0","data":{"chat_text_color":"#FFFFFF","chat_text_weight":700,"client_msg_time":1744428295637,"deviceId":"b7fcf756ba681808121350dbdedb65calive-dc7a5af1-85e8-404","message":"kkkkkkkkkkkkkk","moderator_type":0,"msgId":"3b239442-66fb-4b16-9108-aee8a6676cdc","msg_time":1744428679779,"profile":{"avatar":"https://static.getloconow.com/loco-avatars/d81657ac2b0149c38bf4e57ecae6b490.png","color":"#3312ff","text_color":"#F96D14","text_weight":700,"uid":"4S0UNE5T1A","username":"Soaring.Knife116"},"sticker":{},"stream_uid":"f0704f39-1a61-40a8-abd6-f3b732ca0b25","type":1}}],"last_stream_config_change_time":1744416366043,"live_moderator_count":2,"replace_chats":[],"window":2000}
```

No exemplo acima, se o seu username for `"jonatanseco"`, seu UID será `"C2PKOD2CG6"` (campo `profile.uid`).


## Configuração

### 1. Usando o arquivo `.env` (recomendado)

- Crie um arquivo chamado `.env` na raiz do projeto com o seguinte formato:
  ```
  UID=SEU_UID_AQUI
  AUTHORIZATION=seu_token_de_autorizacao
  X_CLIENT_ID=seu_client_id
  X_CLIENT_SECRET=seu_client_secret
  ```
- Ao abrir o `index.html`, as variáveis serão carregadas automaticamente e usadas nas requisições.

### 2. Usando o modal de configurações

- Clique no ícone de engrenagem (⚙️) no topo direito da interface.
- Preencha os campos `Authorization`, `x-client-id` e `x-client-secret` com suas credenciais.
- Clique em **Salvar**.
- As credenciais são armazenadas apenas no seu navegador (localStorage).

## Uso

1. **Conecte-se a um streamer**
   - Digite o nome do streamer no campo "Streamer" e clique em "Conectar".

2. **Envie mensagens**
   - Preencha o campo de mensagem e clique em "Send" ou pressione Enter.

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).

Você tem permissão para usar, copiar, modificar, mesclar, publicar, distribuir, sublicenciar e/ou vender cópias deste software, desde que preserve o aviso de direitos autorais original. O software é fornecido "no estado em que se encontra", sem garantias de qualquer tipo.
