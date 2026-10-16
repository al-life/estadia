import React, { useState } from "react";
import { View, Pressable, ScrollView, useWindowDimensions } from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  Badge,
  Button,
  C,
  Card,
  Field,
  Icon,
  IconButton,
  Notice,
  PhotoView,
  Progress,
  Sheet,
  Txt,
  S,
  PlatformLogo,
} from "./ui";
import { useWorkspace } from "@/lib/estadia/workspace";
import {
  CHECKLIST,
  FIELD_LABELS,
  LINKS,
  isBookingUrl,
  packageText,
  sessionProgress,
  validateListing,
  type FieldKey,
  type Listing,
  type Photo,
} from "@/lib/estadia/model";
import {
  exportPackage,
  openOfficial,
  removePhoto,
  selectPhotos,
} from "@/lib/estadia/io";

const STEPS = ["Retomada", "Dados e fotos", "Revisão", "Conclusão"];
const SECTIONS: { title: string; keys: FieldKey[] }[] = [
  {
    title: "Sua acomodação",
    keys: ["title", "propertyType", "address", "city", "country"],
  },
  {
    title: "Capacidade e estrutura",
    keys: ["guests", "bedrooms", "beds", "bathrooms"],
  },
  { title: "Conteúdo do anúncio", keys: ["description", "amenities", "rules"] },
  {
    title: "Horários, tarifas e políticas",
    keys: ["checkIn", "checkOut", "cancellation", "price"],
  },
];
export function MigrationSheet({
  sessionId,
  onClose,
  notify,
}: {
  sessionId: string | null;
  onClose: () => void;
  notify: (text: string) => void;
}) {
  const ws = useWorkspace();
  const { width } = useWindowDimensions();
  const wide = width >= 800;
  const [dataTab, setDataTab] = useState<"data" | "photos">("data");
  const [side, setSide] = useState<"source" | "destination">("destination");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [confirmPublished, setConfirmPublished] = useState(false);
  const resolvedSession = ws.workspace.sessions.find((s) => s.id === sessionId);
  const resolvedListing = ws.workspace.listings.find(
    (l) => l.id === resolvedSession?.currentListingId,
  );
  if (!resolvedSession || !resolvedListing) return null;
  const session = resolvedSession;
  const listing = resolvedListing;
  const checks = session.checked[listing.id] || [];
  const issues = validateListing(listing);
  const blockers = issues.filter((i) => i.blocking);
  const ref = session.bookingRefs[listing.id] || "";
  const updateSession = (patch: Partial<typeof session>) =>
    ws.updateSession({ ...session, ...patch });
  const patchListing = (patch: Partial<Listing>) =>
    ws.updateListing({ ...listing, ...patch });
  const change = (key: FieldKey, value: string) =>
    patchListing({ destination: { ...listing.destination, [key]: value } });
  const errorMessage = (e: unknown) =>
    setError(
      e instanceof Error
        ? e.message
        : "Não foi possível concluir. Seu rascunho continua aqui.",
    );
  async function copy(text: string) {
    try {
      await Clipboard.setStringAsync(text);
      notify("Copiado. Cole no campo correspondente do Booking.com.");
    } catch {
      setError(
        "O navegador bloqueou a área de transferência. Selecione e copie o texto manualmente.",
      );
    }
  }
  async function open(url: string) {
    setError("");
    try {
      await openOfficial(url, ws.flush);
    } catch (e) {
      errorMessage(e);
    }
  }
  function pause() {
    updateSession({ paused: true });
    notify("Etapas preservadas neste dispositivo. Retome em Migrações.");
    onClose();
  }
  async function addPhotos() {
    setBusy(true);
    setError("");
    try {
      const photos = await selectPhotos();
      if (photos.length)
        patchListing({ photos: [...listing.photos, ...photos] });
    } catch (e) {
      errorMessage(e);
    } finally {
      setBusy(false);
    }
  }
  async function deletePhoto(photo: Photo) {
    setError("");
    try {
      await removePhoto(photo);
      patchListing({ photos: listing.photos.filter((p) => p.id !== photo.id) });
      setRemoveId(null);
    } catch (e) {
      errorMessage(e);
    }
  }
  function movePhoto(index: number, direction: number) {
    const arr = [...listing.photos];
    const next = index + direction;
    if (next < 0 || next >= arr.length) return;
    [arr[index], arr[next]] = [arr[next], arr[index]];
    patchListing({ photos: arr });
  }
  async function backup() {
    setBusy(true);
    setError("");
    try {
      await ws.flush();
      const all = ws.workspace.listings.filter((l) =>
        session.listingIds.includes(l.id),
      );
      await exportPackage(all, session);
      updateSession({ exportedAt: new Date().toISOString() });
      notify(
        "Pacote de retomada preparado. Nenhum anúncio foi enviado ou publicado.",
      );
    } catch (e) {
      errorMessage(e);
    } finally {
      setBusy(false);
    }
  }
  function toggleCheck(id: string) {
    setError("");
    if (id === "property" && !ref.trim()) {
      setError(
        "Guarde primeiro o ID ou link do cadastro Booking.com no passo Retomada.",
      );
      return;
    }
    if (id === "published" && !checks.includes(id)) {
      setConfirmPublished(true);
      return;
    }
    let next = checks.includes(id)
      ? checks.filter((x) => x !== id)
      : [...checks, id];
    if (id !== "published" && checks.includes(id))
      next = next.filter((x) => x !== "published");
    updateSession({ checked: { ...session.checked, [listing.id]: next } });
  }
  const currentIndex = session.listingIds.indexOf(listing.id);
  const saveStatus = ws.storageError
    ? "Falha no salvamento"
    : ws.saving
      ? "Salvando..."
      : "Salvo neste dispositivo";
  return (
    <Sheet
      visible={!!sessionId}
      wide
      title={listing.destination.title || "Rascunho do anúncio"}
      subtitle={`${listing.demo ? "DEMONSTRAÇÃO · " : ""}Anúncio ${currentIndex + 1} de ${session.listingIds.length} · ${saveStatus}`}
      onClose={pause}
      footer={
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Button
            title="Pausar e guardar"
            icon="pause-outline"
            variant="text"
            compact
            onPress={pause}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {session.step > 0 && (
              <Button
                title="Voltar"
                variant="outline"
                compact
                onPress={() => updateSession({ step: session.step - 1 })}
              />
            )}
            {session.step < 3 ? (
              <Button
                title="Continuar"
                icon="arrow-forward-outline"
                compact
                onPress={() => {
                  updateSession({ step: session.step + 1 });
                  setError("");
                }}
              />
            ) : (
              <Button
                title={busy ? "Preparando..." : "Baixar backup ZIP"}
                icon="download-outline"
                compact
                onPress={backup}
                disabled={busy}
              />
            )}
          </View>
        </View>
      }
    >
      {session.listingIds.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={S.row}>
            {session.listingIds.map((id) => {
              const item = ws.workspace.listings.find((l) => l.id === id);
              return (
                <Button
                  key={id}
                  title={item?.destination.title || "Rascunho"}
                  compact
                  variant={id === listing.id ? "primary" : "outline"}
                  onPress={() => updateSession({ currentListingId: id })}
                />
              );
            })}
          </View>
        </ScrollView>
      )}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 5,
        }}
      >
        {STEPS.map((text, i) => (
          <Pressable
            key={text}
            onPress={() => {
              updateSession({ step: i });
              setError("");
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: session.step === i }}
            style={{
              flex: 1,
              borderBottomWidth: 2,
              borderColor: session.step === i ? C.green : C.line,
              paddingBottom: 12,
              gap: 7,
              flexDirection: wide ? "row" : "column",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 23,
                height: 23,
                backgroundColor: session.step === i ? C.green : C.mint,
                borderRadius: 13,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Txt
                style={{
                  color: session.step === i ? C.white : C.green,
                  fontSize: 11,
                }}
              >
                {i + 1}
              </Txt>
            </View>
            <Txt
              style={{
                fontSize: wide ? 12 : 10,
                fontWeight: session.step === i ? "600" : "400",
                color: session.step === i ? C.green : C.muted,
              }}
            >
              {text}
            </Txt>
          </Pressable>
        ))}
      </View>
      {!!ws.storageError && <Notice tone="coral">{ws.storageError}</Notice>}
      {listing.demo && (
        <Notice tone="amber">
          Este anúncio é ilustrativo. Experimente a revisão, mas não use esses
          dados para publicar uma acomodação real.
        </Notice>
      )}
      {session.step === 0 && (
        <>
          <Notice>
            Se o login cair, seu rascunho e as etapas continuam aqui. A sessão
            do site é controlada pelo Booking.com, não pelo Estadia. Abrimos seu
            navegador normal, sem login incorporado ou modo anônimo.
          </Notice>
          <View style={{ flexDirection: wide ? "row" : "column", gap: 16 }}>
            <Card style={{ flex: 1, padding: 20, gap: 14 }}>
              <View style={S.row}>
                <PlatformLogo name="airbnb" />
                <View>
                  <Txt style={{ fontWeight: "600" }}>
                    1. Sua referência no Airbnb
                  </Txt>
                  <Txt style={{ color: C.muted, fontSize: 11 }}>
                    Link preservado para a importação oficial
                  </Txt>
                </View>
              </View>
              <Field
                label="Link de origem"
                value={listing.sourceUrl}
                onChangeText={(sourceUrl) => patchListing({ sourceUrl })}
                placeholder="https://www.airbnb.com.br/rooms/..."
              />
              <Button
                title="Copiar link do anúncio"
                icon="copy-outline"
                variant="outline"
                onPress={() => copy(listing.sourceUrl)}
                disabled={!listing.sourceUrl}
              />
              <Button
                title="Abrir Airbnb"
                icon="open-outline"
                variant="text"
                onPress={() => open(LINKS.airbnb)}
              />
            </Card>
            <Card style={{ flex: 1, padding: 20, gap: 14 }}>
              <View style={S.row}>
                <PlatformLogo name="booking" />
                <View>
                  <Txt style={{ fontWeight: "600" }}>
                    2. Seu cadastro no Booking.com
                  </Txt>
                  <Txt style={{ color: C.muted, fontSize: 11 }}>
                    Guarde o ID ou link assim que ele existir
                  </Txt>
                </View>
              </View>
              <Field
                label="ID ou link do cadastro Booking.com"
                value={ref}
                onChangeText={(v) =>
                  updateSession({
                    bookingRefs: { ...session.bookingRefs, [listing.id]: v },
                  })
                }
                placeholder="ID da propriedade ou https://admin.booking.com/..."
              />
              <Button
                title={ref ? "Retomar cadastro existente" : "Abrir Booking.com"}
                icon="open-outline"
                onPress={() => {
                  if (ref.startsWith("http") && !isBookingUrl(ref)) {
                    setError(
                      "Use apenas um link HTTPS do domínio booking.com.",
                    );
                    return;
                  }
                  open(isBookingUrl(ref) ? ref : LINKS.booking);
                }}
              />
              {!ref && (
                <Button
                  title="Ainda não tenho cadastro: adicionar"
                  variant="text"
                  onPress={() => open(LINKS.register)}
                />
              )}
              {ref && !isBookingUrl(ref) && (
                <Button
                  title="Copiar ID para localizar na Extranet"
                  icon="copy-outline"
                  variant="text"
                  compact
                  onPress={() => copy(ref)}
                />
              )}
            </Card>
          </View>
          <Notice tone="amber">
            Não crie outro anúncio se você já iniciou um cadastro. Entre na
            mesma conta e procure “Continuar seu cadastro” ou a propriedade
            existente. Conta desativada exige suporte Booking.com; o app não
            consegue reativá-la.
          </Notice>
          <Field
            label="Notas para a próxima tentativa"
            value={session.notes[listing.id] || ""}
            onChangeText={(v) =>
              updateSession({ notes: { ...session.notes, [listing.id]: v } })
            }
            multiline
            placeholder="Ex.: importação feita, falta configurar pagamento. Mensagem exibida ao entrar... (não coloque senhas)"
          />
          <Button
            title="Ver instruções oficiais de cadastro"
            icon="help-circle-outline"
            variant="text"
            onPress={() => open(LINKS.help)}
          />
        </>
      )}
      {session.step === 1 && (
        <>
          <View style={S.row}>
            <Button
              title="Dados do anúncio"
              icon="document-text-outline"
              variant={dataTab === "data" ? "primary" : "outline"}
              compact
              onPress={() => setDataTab("data")}
            />
            <Button
              title={`Fotos (${listing.photos.length})`}
              icon="images-outline"
              variant={dataTab === "photos" ? "primary" : "outline"}
              compact
              onPress={() => setDataTab("photos")}
            />
          </View>
          {dataTab === "data" ? (
            <>
              <Notice>
                À esquerda está a origem que você importou ou preencheu. À
                direita, seu rascunho editável. Estes dados não são lidos da sua
                conta Booking.com nem enviados automaticamente.
              </Notice>
              {!wide && (
                <View style={S.row}>
                  <Button
                    title="Origem"
                    variant={side === "source" ? "primary" : "outline"}
                    compact
                    onPress={() => setSide("source")}
                  />
                  <Button
                    title="Rascunho Booking"
                    variant={side === "destination" ? "primary" : "outline"}
                    compact
                    onPress={() => setSide("destination")}
                  />
                </View>
              )}
              {SECTIONS.map((section) => (
                <View key={section.title} style={{ gap: 12 }}>
                  <Txt style={S.sectionTitle}>{section.title}</Txt>
                  {section.keys.map((key) => (
                    <View
                      key={key}
                      style={{
                        flexDirection: wide ? "row" : "column",
                        gap: 15,
                        alignItems: "stretch",
                      }}
                    >
                      {(wide || side === "source") && (
                        <View
                          style={{
                            flex: 1,
                            padding: 13,
                            backgroundColor: "#F0F2ED",
                            borderRadius: 8,
                            gap: 7,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                            }}
                          >
                            <Txt style={{ fontSize: 11, color: C.muted }}>
                              {FIELD_LABELS[key]} · origem
                            </Txt>
                            <IconButton
                              name="copy-outline"
                              label={`Copiar ${FIELD_LABELS[key]} da origem`}
                              onPress={() => copy(listing.source[key])}
                            />
                          </View>
                          <Txt
                            selectable
                            style={{
                              fontSize: 12,
                              color: listing.source[key] ? C.ink : C.muted,
                            }}
                          >
                            {listing.source[key] || "Não informado na origem"}
                          </Txt>
                        </View>
                      )}
                      {(wide || side === "destination") && (
                        <View style={{ flex: 1 }}>
                          <Field
                            label={FIELD_LABELS[key]}
                            value={listing.destination[key]}
                            onChangeText={(value) => change(key, value)}
                            multiline={[
                              "description",
                              "rules",
                              "amenities",
                              "cancellation",
                            ].includes(key)}
                            numeric={[
                              "guests",
                              "beds",
                              "bedrooms",
                              "bathrooms",
                              "price",
                            ].includes(key)}
                          />
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "flex-end",
                              marginTop: 2,
                            }}
                          >
                            <Button
                              title="Copiar para preencher"
                              icon="copy-outline"
                              variant="text"
                              compact
                              onPress={() => copy(listing.destination[key])}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </>
          ) : (
            <>
              <Notice>
                Fotos ficam somente neste dispositivo. Use JPG/PNG, menos de 47
                MB e mínimo 1280 × 900 px. O cadastro oficial orienta pelo menos
                5 fotos. O pacote ZIP leva os arquivos anexados, na ordem
                escolhida.
              </Notice>
              <Button
                title={
                  busy ? "Selecionando..." : "Adicionar fotos do dispositivo"
                }
                icon="add-outline"
                onPress={addPhotos}
                disabled={busy}
              />
              {listing.photos.map((photo, index) => (
                <Card key={photo.id} style={{ padding: 14, gap: 10 }}>
                  <View
                    style={{ flexDirection: wide ? "row" : "column", gap: 14 }}
                  >
                    <PhotoView
                      photo={photo}
                      style={{
                        width: wide ? 145 : "100%",
                        height: 120,
                        borderRadius: 6,
                      }}
                      onMissing={() => {
                        if (photo.width !== 0)
                          patchListing({
                            photos: listing.photos.map((p) =>
                              p.id === photo.id
                                ? { ...p, width: 0, height: 0 }
                                : p,
                            ),
                          });
                      }}
                    />
                    <View style={{ flex: 1, gap: 9 }}>
                      <Txt style={{ fontWeight: "600", fontSize: 12 }}>
                        {index + 1}. {photo.name}
                      </Txt>
                      <Txt style={{ fontSize: 11, color: C.muted }}>
                        {photo.width || "?"} × {photo.height || "?"} px ·{" "}
                        {(photo.size / (1024 * 1024)).toFixed(1)} MB
                      </Txt>
                      <Field
                        label={`Legenda da foto ${index + 1}`}
                        value={photo.caption}
                        onChangeText={(v) =>
                          patchListing({
                            photos: listing.photos.map((p) =>
                              p.id === photo.id ? { ...p, caption: v } : p,
                            ),
                          })
                        }
                      />
                    </View>
                    <View style={{ flexDirection: wide ? "column" : "row" }}>
                      <IconButton
                        name="arrow-up-outline"
                        label="Mover foto para antes"
                        onPress={() => movePhoto(index, -1)}
                      />
                      <IconButton
                        name="arrow-down-outline"
                        label="Mover foto para depois"
                        onPress={() => movePhoto(index, 1)}
                      />
                      <IconButton
                        name="trash-outline"
                        label="Remover foto"
                        onPress={() => setRemoveId(photo.id)}
                      />
                    </View>
                  </View>
                  {removeId === photo.id && (
                    <View style={S.row}>
                      <Txt style={{ flex: 1, fontSize: 12, color: C.coral }}>
                        Remover este arquivo do rascunho local?
                      </Txt>
                      <Button
                        title="Cancelar"
                        compact
                        variant="text"
                        onPress={() => setRemoveId(null)}
                      />
                      <Button
                        title="Remover"
                        compact
                        variant="outline"
                        onPress={() => deletePhoto(photo)}
                      />
                    </View>
                  )}
                </Card>
              ))}
              {!listing.photos.length && (
                <Txt
                  style={{ textAlign: "center", padding: 25, color: C.muted }}
                >
                  Nenhuma foto anexada ainda.
                </Txt>
              )}
            </>
          )}
        </>
      )}
      {session.step === 2 && (
        <>
          <View style={{ flexDirection: wide ? "row" : "column", gap: 18 }}>
            <Card style={{ flex: 1, padding: 20, gap: 12 }}>
              <Icon
                name={
                  blockers.length
                    ? "clipboard-outline"
                    : "checkmark-circle-outline"
                }
                size={30}
                color={blockers.length ? C.amber : C.green}
              />
              <Txt style={S.sectionTitle}>
                {blockers.length
                  ? `${blockers.length} pendências para revisar`
                  : "Rascunho organizado"}
              </Txt>
              <Txt style={{ color: C.muted, fontSize: 12 }}>
                Validação local, não aprovação do Booking.com. Você pode baixar
                o backup mesmo com campos pendentes.
              </Txt>
              <Badge text="Nenhum dado publicado automaticamente" />
            </Card>
            <Card style={{ flex: 1, padding: 20, gap: 10 }}>
              <Txt style={S.eyebrow}>PACOTE DE RETOMADA</Txt>
              <Txt style={{ fontWeight: "600" }}>
                {listing.photos.filter((p) => !p.demo).length} arquivos de fotos
                · {Object.keys(FIELD_LABELS).length} campos
              </Txt>
              <Txt style={{ color: C.muted, fontSize: 12 }}>
                Inclui dados, notas, referência de cadastro, checklist e
                manifesto das fotos. Fotos ilustrativas não vão no ZIP.
              </Txt>
              <Button
                title="Copiar resumo preenchido"
                icon="copy-outline"
                variant="outline"
                onPress={() => copy(packageText(listing, session))}
              />
            </Card>
          </View>
          {issues.map((issue) => (
            <Pressable
              key={issue.key}
              accessibilityRole="button"
              onPress={() => {
                updateSession({ step: 1 });
                setDataTab(issue.section === "photos" ? "photos" : "data");
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                backgroundColor: C.white,
                borderWidth: 1,
                borderColor: C.line,
                borderRadius: 9,
                padding: 14,
              }}
            >
              <Icon
                name={
                  issue.blocking
                    ? "alert-circle-outline"
                    : "information-circle-outline"
                }
                color={issue.blocking ? C.amber : C.muted}
              />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 12, fontWeight: "600" }}>
                  {issue.label}
                </Txt>
                <Txt style={{ fontSize: 11, color: C.muted }}>
                  {issue.detail}
                </Txt>
              </View>
              <Icon name="chevron-forward" size={15} />
            </Pressable>
          ))}
          <Notice>
            Tarifas, políticas, licenças e verificações variam por propriedade.
            Confirme os requisitos finais na Extranet. A descrição do
            Booking.com pode ser gerada a partir das características, sem
            aceitar seu texto literalmente.
          </Notice>
        </>
      )}
      {session.step === 3 && (
        <>
          <View style={{ gap: 9 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Txt style={S.sectionTitle}>Seu ponto de retomada</Txt>
              <Badge
                text={`${sessionProgress(session)}% registrado por você`}
              />
            </View>
            <Progress value={sessionProgress(session)} />
            <Txt style={{ fontSize: 12, color: C.muted }}>
              Marque apenas o que você já concluiu e conferiu no site oficial. O
              Estadia não verifica o status da sua conta.
            </Txt>
          </View>
          {CHECKLIST.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="checkbox"
              accessibilityLabel={item.title}
              accessibilityState={{
                checked: checks.includes(item.id),
                disabled:
                  item.id === "published" &&
                  CHECKLIST.slice(0, -1).some((c) => !checks.includes(c.id)),
              }}
              disabled={
                item.id === "published" &&
                CHECKLIST.slice(0, -1).some((c) => !checks.includes(c.id))
              }
              onPress={() => toggleCheck(item.id)}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
                backgroundColor: C.white,
                borderWidth: 1,
                borderColor: checks.includes(item.id) ? "#CCDCCE" : C.line,
                borderRadius: 9,
                padding: 14,
                opacity:
                  item.id === "published" &&
                  CHECKLIST.slice(0, -1).some((c) => !checks.includes(c.id))
                    ? 0.45
                    : 1,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderWidth: 1,
                  borderColor: checks.includes(item.id) ? C.green : "#C9D0C8",
                  borderRadius: 6,
                  backgroundColor: checks.includes(item.id) ? C.green : C.white,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {checks.includes(item.id) && (
                  <Icon name="checkmark" size={16} color={C.white} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontSize: 12, fontWeight: "600" }}>
                  {item.title}
                </Txt>
                <Txt style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                  {item.detail}
                </Txt>
              </View>
            </Pressable>
          ))}
          {confirmPublished && (
            <Card
              style={{ padding: 16, backgroundColor: C.amberLight, gap: 10 }}
            >
              <Txt style={{ fontSize: 12, color: C.amber }}>
                Você conferiu no Booking.com que esta acomodação está aberta
                para reservas? Esta marcação é só um registro local.
              </Txt>
              <View style={S.row}>
                <Button
                  title="Ainda não"
                  variant="text"
                  compact
                  onPress={() => setConfirmPublished(false)}
                />
                <Button
                  title="Sim, conferi no site"
                  compact
                  onPress={() => {
                    updateSession({
                      checked: {
                        ...session.checked,
                        [listing.id]: [...checks, "published"],
                      },
                    });
                    setConfirmPublished(false);
                    notify(
                      "Conclusão registrada por você, sem verificação por API.",
                    );
                  }}
                />
              </View>
            </Card>
          )}
          <View style={{ flexDirection: wide ? "row" : "column", gap: 12 }}>
            <Button
              title="Abrir Booking.com para concluir"
              icon="open-outline"
              onPress={() => open(isBookingUrl(ref) ? ref : LINKS.booking)}
            />
            <Button
              title="Conta desativada? Ajuda oficial"
              icon="help-circle-outline"
              variant="outline"
              onPress={() => open(LINKS.support)}
            />
          </View>
          {session.exportedAt && (
            <Notice>
              Último pacote preparado em{" "}
              {new Date(session.exportedAt).toLocaleString("pt-BR")}. Isso não
              significa que o cadastro foi enviado ou publicado.
            </Notice>
          )}
        </>
      )}
      {!!error && <Notice tone="coral">{error}</Notice>}
    </Sheet>
  );
}
