import React, { useState } from "react";
import { View, Pressable, useWindowDimensions } from "react-native";
import { Button, C, Field, Icon, Notice, Sheet, Txt, S } from "./ui";
import {
  createListing,
  blankData,
  FIELD_LABELS,
  IMPORT_TEMPLATE,
  isAirbnbUrl,
  parseImport,
  type FieldKey,
  type Listing,
} from "@/lib/estadia/model";
import { importJsonFile, exportText } from "@/lib/estadia/io";

type Method = "link" | "file" | "manual";
export function ImportSheet({
  visible,
  onClose,
  onImport,
}: {
  visible: boolean;
  onClose: () => void;
  onImport: (listings: Listing[]) => void;
}) {
  const [method, setMethod] = useState<Method>("link");
  const [url, setUrl] = useState("");
  const [data, setData] = useState(blankData());
  const [json, setJson] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { width } = useWindowDimensions();
  async function submit() {
    setError("");
    try {
      let items: Listing[];
      if (method === "file") items = parseImport(json);
      else {
        if (!data.title.trim())
          throw new Error(
            "Dê um nome ao seu rascunho para encontrá-lo depois.",
          );
        if ((method === "link" || url) && !isAirbnbUrl(url))
          throw new Error(
            "Cole o link completo do anúncio: https://www.airbnb.com.br/rooms/123456789.",
          );
        items = [createListing(data, url.trim())];
      }
      onImport(items);
      setData(blankData());
      setUrl("");
      setJson("");
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível ler os dados.",
      );
    }
  }
  async function pick() {
    setBusy(true);
    setError("");
    try {
      const text = await importJsonFile();
      if (text) {
        parseImport(text);
        setJson(text);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível abrir o arquivo.",
      );
    } finally {
      setBusy(false);
    }
  }
  const setField = (key: FieldKey, value: string) =>
    setData((d) => ({ ...d, [key]: value }));
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Um novo destino para seu anúncio"
      subtitle="Primeiro, guarde uma referência. Você poderá retomar sem começar do zero."
      footer={
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Txt style={{ fontSize: 10, color: C.muted, flex: 1 }}>
            Sem senha. Sem envio automático.
          </Txt>
          <Button
            title={
              method === "file" ? "Importar rascunhos" : "Salvar e continuar"
            }
            icon="arrow-forward-outline"
            onPress={submit}
            disabled={busy}
          />
        </View>
      }
    >
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(
          [
            { id: "link", name: "Link Airbnb", icon: "link-outline" },
            {
              id: "file",
              name: "Arquivo / JSON",
              icon: "document-text-outline",
            },
            { id: "manual", name: "Preencher", icon: "create-outline" },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              setMethod(item.id);
              setError("");
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: method === item.id }}
            style={{
              flex: 1,
              paddingVertical: 12,
              gap: 6,
              alignItems: "center",
              borderWidth: 1,
              borderRadius: 10,
              borderColor: method === item.id ? C.green : C.line,
              backgroundColor: method === item.id ? C.mint : C.white,
            }}
          >
            <Icon
              name={item.icon}
              size={20}
              color={method === item.id ? C.green : C.muted}
            />
            <Txt style={{ fontSize: width < 450 ? 10 : 12, fontWeight: "600" }}>
              {item.name}
            </Txt>
          </Pressable>
        ))}
      </View>
      {method === "link" && (
        <>
          <Notice>
            O próprio Booking.com pode importar seu anúncio pelo link do Airbnb.
            Aqui, salvamos o link e as etapas para você não perder a referência
            se o login cair.
          </Notice>
          <Field
            label="Link do anúncio no Airbnb"
            value={url}
            onChangeText={setUrl}
            placeholder="https://www.airbnb.com.br/rooms/..."
            required
          />
          <Field
            label="Nome para identificar este rascunho"
            value={data.title}
            onChangeText={(v) => setField("title", v)}
            placeholder="Ex.: Apartamento em Copacabana"
            required
          />
          <View style={{ gap: 8 }}>
            <Txt style={S.eyebrow}>O QUE ACONTECE DEPOIS</Txt>
            {[
              "Seu rascunho fica salvo neste dispositivo.",
              "Você abre o cadastro no navegador oficial.",
              "Cola o link, importa e registra o que já concluiu.",
            ].map((text, i) => (
              <View key={text} style={S.row}>
                <View
                  style={{
                    width: 23,
                    height: 23,
                    backgroundColor: C.mint,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Txt style={{ fontSize: 11, color: C.green }}>{i + 1}</Txt>
                </View>
                <Txt style={{ fontSize: 12, color: C.muted, flex: 1 }}>
                  {text}
                </Txt>
              </View>
            ))}
          </View>
        </>
      )}
      {method === "file" && (
        <>
          <Notice>
            Leia um arquivo JSON no formato Estadia ou cole o conteúdo abaixo.
            Não é uma conexão à API do Airbnb. Fotos devem ser anexadas depois;
            um JSON não contém os arquivos.
          </Notice>
          <View style={S.row}>
            <Button
              title={busy ? "Lendo arquivo..." : "Escolher arquivo .json"}
              icon="cloud-upload-outline"
              variant="outline"
              onPress={pick}
              disabled={busy}
            />
            <Button
              title="Baixar modelo"
              variant="text"
              onPress={() =>
                exportText(IMPORT_TEMPLATE).catch((e) => setError(e.message))
              }
            />
          </View>
          <Field
            label="Conteúdo JSON (até 50 anúncios)"
            value={json}
            onChangeText={setJson}
            placeholder={IMPORT_TEMPLATE}
            multiline
          />
        </>
      )}
      {method === "manual" && (
        <>
          <Field
            label="Link Airbnb (opcional)"
            value={url}
            onChangeText={setUrl}
          />
          <View style={{ gap: 14 }}>
            {(
              [
                "title",
                "propertyType",
                "address",
                "city",
                "country",
                "description",
              ] as FieldKey[]
            ).map((key) => (
              <Field
                key={key}
                label={FIELD_LABELS[key]}
                value={data[key]}
                onChangeText={(v) => setField(key, v)}
                multiline={key === "description"}
                required={key === "title"}
              />
            ))}
          </View>
          <Notice>
            Você pode completar capacidade, comodidades, políticas e fotos
            durante a revisão. Nenhuma informação ausente será inventada.
          </Notice>
        </>
      )}
      {!!error && <Notice tone="coral">{error}</Notice>}
    </Sheet>
  );
}
