import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
  ActivityIndicator,
  type ViewStyle,
  type ImageStyle,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { type Photo } from "@/lib/estadia/model";
import { DEMO_IMAGES } from "@/lib/estadia/demo";
import { photoUri, releasePhotoUri } from "@/lib/estadia/io";

export const C = {
  green: "#244F43",
  greenDark: "#1D4036",
  mint: "#EDF3EE",
  bg: "#F8F9F6",
  white: "#FFFFFF",
  ink: "#263A32",
  muted: "#7C857F",
  line: "#E8EBE5",
  coral: "#DF725D",
  coralLight: "#FCF0EB",
  amber: "#AA834B",
  amberLight: "#F7F1E4",
  blue: "#003B95",
};
export const fonts = {
  sans: Platform.OS === "web" ? "Inter, system-ui, sans-serif" : undefined,
  serif: Platform.OS === "ios" ? "Georgia" : "serif",
};
export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export function Icon({
  name,
  size = 20,
  color = C.muted,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function Txt({
  children,
  style,
  ...props
}: React.ComponentProps<typeof Text>) {
  return (
    <Text
      {...props}
      style={[
        { fontFamily: fonts.sans, color: C.ink, fontSize: 14, lineHeight: 21 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View
        style={{
          width: 37,
          height: 37,
          backgroundColor: C.green,
          borderRadius: 11,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={require("@/assets/images/icon.png")}
          style={{ width: 37, height: 37, borderRadius: 11 }}
          contentFit="contain"
        />
      </View>
      {!compact && (
        <Txt
          style={{
            fontFamily: fonts.serif,
            fontSize: 29,
            lineHeight: 34,
            letterSpacing: -1.2,
            color: C.green,
          }}
        >
          estadia<Txt style={{ color: C.coral, fontSize: 28 }}>.</Txt>
        </Txt>
      )}
    </View>
  );
}
export function PlatformLogo({
  name,
  size = 34,
}: {
  name: "airbnb" | "booking";
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 9,
        backgroundColor: name === "airbnb" ? "#FFF0ED" : "#EAF0FA",
      }}
    >
      {name === "airbnb" ? (
        <FontAwesome5 name="airbnb" size={size * 0.62} color="#E26D5C" />
      ) : (
        <Txt
          style={{
            fontSize: size * 0.56,
            color: C.blue,
            fontWeight: "800",
            lineHeight: size,
          }}
        >
          B.
        </Txt>
      )}
    </View>
  );
}
export function Button({
  title,
  onPress,
  icon,
  variant = "primary",
  disabled,
  compact,
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  variant?: "primary" | "outline" | "soft" | "text";
  disabled?: boolean;
  compact?: boolean;
  style?: ViewStyle;
}) {
  const [hover, setHover] = useState(false);
  const primary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          paddingHorizontal: compact ? 12 : 17,
          paddingVertical: compact ? 9 : 12,
          minHeight: compact ? 38 : 44,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: C.line,
          backgroundColor: primary
            ? hover
              ? C.greenDark
              : C.green
            : variant === "soft"
              ? C.mint
              : variant === "outline"
                ? C.white
                : "transparent",
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {icon && (
        <Icon name={icon} size={17} color={primary ? C.white : C.green} />
      )}
      <Txt
        style={{
          color: primary ? C.white : C.green,
          fontSize: 13,
          fontWeight: "600",
          lineHeight: 19,
        }}
      >
        {title}
      </Txt>
    </Pressable>
  );
}
export function IconButton({
  name,
  onPress,
  label,
  active = false,
}: {
  name: IconName;
  onPress: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        padding: 10,
        backgroundColor: active ? C.mint : pressed ? C.line : "transparent",
        borderRadius: 7,
      })}
    >
      <Icon name={name} size={19} color={active ? C.green : C.muted} />
    </Pressable>
  );
}
export function Badge({
  text,
  color = C.green,
  background = C.mint,
  dot = false,
}: {
  text: string;
  color?: string;
  background?: string;
  dot?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 5,
        alignItems: "center",
        backgroundColor: background,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 5,
        alignSelf: "flex-start",
      }}
    >
      {dot && (
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: color,
          }}
        />
      )}
      <Txt style={{ color, fontSize: 10, lineHeight: 15, fontWeight: "600" }}>
        {text}
      </Txt>
    </View>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: C.white,
          borderWidth: 1,
          borderColor: C.line,
          borderRadius: 12,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numeric = false,
  required = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numeric?: boolean;
  required?: boolean;
}) {
  return (
    <View style={{ gap: 7 }}>
      <Txt style={{ fontSize: 12, fontWeight: "600" }}>
        {label}
        {required && <Txt style={{ color: C.coral }}> *</Txt>}
      </Txt>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || "Não informado"}
        placeholderTextColor="#A7ADA7"
        multiline={multiline}
        keyboardType={numeric ? "numeric" : "default"}
        style={[
          S.input,
          multiline && { minHeight: 100, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}
export function PhotoView({
  photo,
  style,
  onMissing,
}: {
  photo?: Photo;
  style: ImageStyle;
  onMissing?: () => void;
}) {
  const [uri, setUri] = useState("");
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (!photo || photo.demo) return;
    let active = true;
    let loaded = "";
    photoUri(photo)
      .then((value) => {
        loaded = value;
        if (active) setUri(value);
        else releasePhotoUri(value);
      })
      .catch(() => {
        if (active) {
          setMissing(true);
          onMissing?.();
        }
      });
    return () => {
      active = false;
      if (loaded) releasePhotoUri(loaded);
    };
  }, [photo?.uri]);
  if (photo?.demo && DEMO_IMAGES[photo.uri])
    return (
      <Image source={DEMO_IMAGES[photo.uri]} style={style} contentFit="cover" />
    );
  if (!photo || missing || !uri)
    return (
      <View
        style={[
          style,
          {
            backgroundColor: "#EEF0EA",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
          },
        ]}
      >
        {photo && !missing ? (
          <ActivityIndicator color={C.green} />
        ) : (
          <>
            <Icon name="image-outline" size={28} color="#A9B5AA" />
            <Txt style={{ fontSize: 10, color: C.muted }}>
              {missing ? "Arquivo ausente" : "Adicione suas fotos"}
            </Txt>
          </>
        )}
      </View>
    );
  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit="cover"
      onError={() => {
        setMissing(true);
        onMissing?.();
      }}
    />
  );
}
export function Sheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(20,38,28,.42)",
          alignItems: "center",
          justifyContent: "center",
          padding: Platform.OS === "web" ? 24 : 12,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: wide ? 1080 : 640,
            maxHeight: "94%",
            backgroundColor: C.bg,
            borderRadius: 18,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: C.line,
          }}
        >
          <View
            style={{
              padding: 22,
              borderBottomWidth: 1,
              borderColor: C.line,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <View style={{ flex: 1 }}>
              <Txt
                style={{
                  fontFamily: fonts.serif,
                  fontSize: 26,
                  lineHeight: 32,
                }}
              >
                {title}
              </Txt>
              {subtitle && (
                <Txt style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>
                  {subtitle}
                </Txt>
              )}
            </View>
            <IconButton
              name="close-outline"
              label="Fechar e manter o rascunho"
              onPress={onClose}
            />
          </View>
          <ScrollView
            contentContainerStyle={{ padding: 22, gap: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {footer && (
            <View
              style={{
                padding: 16,
                paddingHorizontal: 22,
                backgroundColor: C.white,
                borderTopWidth: 1,
                borderColor: C.line,
              }}
            >
              {footer}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
export function Notice({
  children,
  tone = "green",
}: {
  children: React.ReactNode;
  tone?: "green" | "amber" | "coral";
}) {
  return (
    <View
      style={{
        backgroundColor:
          tone === "amber"
            ? C.amberLight
            : tone === "coral"
              ? C.coralLight
              : C.mint,
        borderRadius: 9,
        padding: 14,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <Icon
        name={
          tone === "coral"
            ? "alert-circle-outline"
            : "information-circle-outline"
        }
        size={19}
        color={
          tone === "amber" ? C.amber : tone === "coral" ? C.coral : C.green
        }
      />
      <View style={{ flex: 1 }}>
        <Txt
          style={{
            fontSize: 12,
            lineHeight: 19,
            color:
              tone === "amber"
                ? "#866735"
                : tone === "coral"
                  ? "#A45543"
                  : C.green,
          }}
        >
          {children}
        </Txt>
      </View>
    </View>
  );
}
export function Progress({
  value,
  color = C.green,
}: {
  value: number;
  color?: string;
}) {
  return (
    <View
      style={{
        height: 4,
        backgroundColor: C.line,
        borderRadius: 5,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: 4,
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: color,
          borderRadius: 5,
        }}
      />
    </View>
  );
}
export const S = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: C.white,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: C.ink,
    minHeight: 44,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 25,
    letterSpacing: -0.4,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.6,
    color: C.muted,
    lineHeight: 16,
  },
});
