# Estadia

Aplicativo Expo/React Native para organizar uma transferência assistida Airbnb → Booking.com. A prioridade é conservar os dados e as etapas do usuário quando ele precisa interromper o cadastro ou perde o login no site externo.

## Uso

Em **Preparar meu anúncio**, guarde o link público do Airbnb e um nome para o rascunho. Também é possível ler um JSON no formato Estadia, importar vários anúncios de uma vez ou preencher um formulário. Os anúncios iniciais são exemplos sinalizados; não são dados das suas contas.

No passo **Retomada**, abra a Extranet no navegador habitual. O Booking.com documenta a importação pelo link do Airbnb durante o cadastro. Se você já iniciou uma propriedade, retome o cadastro existente. Guarde no Estadia o ID ou link da propriedade assim que disponível.

No passo **Dados e fotos**, revise a origem preservada e o rascunho de destino lado a lado em tela ampla. Em tela estreita, alterne as duas visões. Complete campos, anexe fotos, reorganize a ordem e edite legendas. Todas as alterações no rascunho são salvas localmente. O aplicativo não lê os valores que foram preenchidos apenas no formulário externo.

Em **Conclusão**, marque as etapas que você realmente concluiu no site oficial. O Estadia não verifica esses estados por API. Pause e retome em **Migrações**. Baixe um ZIP com campos, fotos anexadas, notas, ID/link e checklist. Um backup pode ser restaurado nas configurações de armazenamento, adicionando cópias sem apagar dados atuais. No celular, toque na marca Estadia no topo para abrir essas configurações.

No Galaxy Z Fold, use a função de tela dividida do próprio aparelho para manter Booking.com no navegador ao lado do Estadia. Dentro do Estadia, a comparação origem/destino adapta-se automaticamente à largura. O app não incorpora o login em iframe ou WebView.

## Limites importantes

O Estadia **não prolonga o login**, não recupera uma conta desativada e não garante que o Booking.com preservou seu formulário. Somente os dados copiados/preenchidos no Estadia são protegidos por esta versão. Desativação deve ser tratada com o suporte Booking.com. Nenhuma senha é coletada ou armazenada; não há integração API de parceiro configurada nem publicação automática.

Metadados ficam no AsyncStorage, fotos no IndexedDB do navegador ou nos arquivos privados do app. Limpar os dados do navegador ou desinstalar o app pode remover o workspace. Não há sincronização automática entre dispositivos. Exportar/restaurar o ZIP é uma transferência manual. Os arquivos podem conter endereço e fotos da propriedade: guarde-os em local privado.

A pré-validação de fotos segue a orientação oficial consultada em 15/10/2026: pelo menos 5 fotos JPG/PNG, menos de 47 MB por foto, no mínimo 1280 × 900 pixels. Booking.com pode exigir informações específicas da propriedade; a aprovação final acontece na Extranet. As descrições do Estadia são de referência, sem promessa de aceitação literal pelo Booking.com.

## Execução

`pnpm dev` inicia Metro/Web na porta 8081 e API na 3000. `pnpm check` verifica TypeScript. Os testes de domínio e backup estão em `tests/estadia*.test.ts`. O backend foi preservado e a tabela do starter foi preparada; dados de migração nesta versão ficam somente no dispositivo.

O Dashboard prepara Expo Go e builds Android/iOS com credenciais inseridas na interface protegida. Exportar um bundle JavaScript Android não é gerar nem testar um APK instalado.

## Fonte oficial

[Cadastro e importação por link no Booking.com](https://partner.booking.com/en-us/help/first-steps/registration/registering-your-property-bookingcom-step-step).
