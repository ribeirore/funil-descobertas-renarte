# Renarte Briefing

Funil de briefing mobile-first para encomendas de pinturas Renarte.

## Funcionalidades

O projeto possui navegação direta entre as etapas, preserva todas as respostas, aceita links e imagens, exibe prévias locais, compila o resumo e envia os dados por e-mail com anexos reais. A tela de sucesso usa a logo Renarte como marca d’água e informa o prazo de retorno de 2 dias.

## Deploy na Vercel

Importe o repositório como projeto Vercel. O arquivo `index.html` é a demonstração estática e a pasta `api` contém a função serverless que processa o envio.

Configure as variáveis de ambiente:

```text
RESEND_API_KEY=sua_chave_resend
RESEND_FROM_EMAIL=briefing@seu-dominio-verificado.com
```

O endereço usado em `RESEND_FROM_EMAIL` precisa estar autorizado no Resend. O destinatário está configurado no endpoint como `renatartistico@gmail.com`.

## Limites de upload

A função aceita imagens JPG, PNG, WEBP e GIF. Cada arquivo pode ter até 5 MB e o total de anexos pode ter até 8 MB. Os arquivos são mantidos no navegador até o envio e chegam como anexos no e-mail.

## Estrutura

- `index.html`: versão estática pronta para visualização e deploy.
- `App.tsx`: versão React com hooks, Tailwind CSS e Lucide React.
- `api/send-briefing.ts`: função serverless de envio pelo Resend.
- `Logo-Renarte-SemFundo.png`: logo usada no cabeçalho e na marca d’água.
