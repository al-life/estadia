import React from "react";
import { View, Pressable } from "react-native";
import {
  Badge,
  Button,
  Card,
  C,
  Icon,
  PhotoView,
  Progress,
  Txt,
  S,
} from "./ui";
import {
  type Listing,
  type Session,
  validateListing,
  readiness,
  sessionProgress,
} from "@/lib/estadia/model";

export function ListingCard({
  listing,
  selected,
  onSelect,
  onReview,
  session,
  horizontal = false,
}: {
  listing: Listing;
  selected: boolean;
  onSelect: () => void;
  onReview: () => void;
  session?: Session;
  horizontal?: boolean;
}) {
  const issues = validateListing(listing).filter((i) => i.blocking).length;
  return (
    <Card
      style={{
        flex: 1,
        borderColor: selected ? C.green : C.line,
        flexDirection: horizontal ? "row" : "column",
      }}
    >
      <View
        style={{
          width: horizontal ? 180 : "100%",
          height: horizontal ? "100%" : 155,
          minHeight: 145,
        }}
      >
        <PhotoView
          photo={listing.photos[0]}
          style={{ width: "100%", height: "100%" }}
        />
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={`Selecionar ${listing.destination.title}`}
          accessibilityState={{ checked: selected }}
          onPress={onSelect}
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            width: 23,
            height: 23,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: selected ? C.green : "#FFFFFF",
            backgroundColor: selected ? C.green : "rgba(255,255,255,.92)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {selected && <Icon name="checkmark" size={16} color={C.white} />}
        </Pressable>
        {listing.demo && (
          <View style={{ position: "absolute", right: 12, top: 12 }}>
            <Badge
              text="EXEMPLO"
              color={C.green}
              background="rgba(255,255,255,.94)"
            />
          </View>
        )}
        <View
          style={{
            position: "absolute",
            bottom: 10,
            left: 12,
            backgroundColor: "rgba(255,255,255,.95)",
            padding: 5,
            paddingHorizontal: 8,
            borderRadius: 6,
            flexDirection: "row",
            gap: 4,
            alignItems: "center",
          }}
        >
          <Icon name="images-outline" size={12} color={C.ink} />
          <Txt style={{ fontSize: 10, lineHeight: 15 }}>
            {listing.photos.length}{" "}
            {listing.photos.length === 1 ? "foto" : "fotos"}
          </Txt>
        </View>
      </View>
      <View style={{ padding: 17, gap: 10, flex: 1 }}>
        <View style={{ gap: 3 }}>
          <Txt
            numberOfLines={1}
            style={{ fontSize: 15, fontWeight: "600", letterSpacing: -0.25 }}
          >
            {listing.destination.title || "Rascunho sem nome"}
          </Txt>
          <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
            <Icon name="location-outline" size={12} />
            <Txt style={{ fontSize: 11, color: C.muted }}>
              {listing.destination.city || "Cidade a preencher"}
              {listing.destination.country
                ? `, ${listing.destination.country}`
                : ""}
            </Txt>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 13 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name="people-outline" size={13} />
            <Txt style={{ fontSize: 10, color: C.muted }}>
              {listing.destination.guests || "–"} hóspedes
            </Txt>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name="bed-outline" size={13} />
            <Txt style={{ fontSize: 10, color: C.muted }}>
              {listing.destination.bedrooms || "–"} quartos
            </Txt>
          </View>
        </View>
        <View style={{ marginTop: 3, gap: 8 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Badge
              text={
                session?.paused
                  ? "Retomada pendente"
                  : issues
                    ? "A completar"
                    : "Pronto para revisão"
              }
              color={issues || session?.paused ? C.amber : C.green}
              background={issues || session?.paused ? C.amberLight : C.mint}
              dot
            />
            <Txt style={{ fontSize: 10, color: C.muted }}>
              {session
                ? `${sessionProgress(session)}% concluído por você`
                : `${readiness(listing)}% preparado`}
            </Txt>
          </View>
          <Progress
            value={session ? sessionProgress(session) : readiness(listing)}
            color={issues ? "#CAA77B" : C.green}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderTopWidth: 1,
            borderColor: C.line,
            paddingTop: 10,
            marginTop: 1,
          }}
        >
          <Txt style={{ fontSize: 10, color: C.muted }}>
            {issues} {issues === 1 ? "pendência local" : "pendências locais"}
          </Txt>
          <Button
            title={session ? "Retomar" : "Preparar"}
            icon="arrow-forward-outline"
            variant="text"
            compact
            onPress={onReview}
            style={{ paddingHorizontal: 0 }}
          />
        </View>
      </View>
    </Card>
  );
}
