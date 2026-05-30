import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeColor } from "@/utils/theme";

type SpriteAction = "idle" | "sleep" | "yawn";

const ACTIONS: SpriteAction[] = ["idle", "sleep", "yawn"];

interface SpriteProps {
  action: SpriteAction;
  duration?: number;
}

function GamificationSpriteScreen({ action, duration = 2000 }: SpriteProps) {
  const [currentAction, setCurrentAction] = useState<SpriteAction>(action);
  const colors = useThemeColor();

  useEffect(() => {
    setCurrentAction(action);
  }, [action]);

  useEffect(() => {
    if (currentAction !== action) {
      return;
    }

    const rotation = setInterval(() => {
      setCurrentAction((value) => {
        const index = ACTIONS.indexOf(value);
        return ACTIONS[(index + 1) % ACTIONS.length];
      });
    }, duration);

    return () => clearInterval(rotation);
  }, [action, currentAction, duration]);

  const t = {
    bg: colors.background,
    border: colors.border,
    surface: colors.foreground,
    muted: colors.secondary,
    mutedFg: colors.mutedForeground,
    fg: colors.foreground,
    primary: colors.primary,
    pageBg: colors.background,
  };

  // ─── animated values ─────────────────────────────────────────────────────
  const levitate     = useRef(new Animated.Value(0)).current;
  const shadowScale  = useRef(new Animated.Value(1)).current;
  const eyeScaleY    = useRef(new Animated.Value(1)).current;
  const mouthHeight  = useRef(new Animated.Value(3)).current;
  const leftHandRot  = useRef(new Animated.Value(0)).current;
  const rightHandRot = useRef(new Animated.Value(0)).current;
  const antennaPulse = useRef(new Animated.Value(0.5)).current;
  const zzzOpacity   = useRef(new Animated.Value(0)).current;
  const zzzY         = useRef(new Animated.Value(0)).current;

  // ─── perpetual levitation ─────────────────────────────────────────────────
  useEffect(() => {
    setCurrentAction(action);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(levitate, { toValue: -12, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(shadowScale, { toValue: 0.7, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(levitate, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(shadowScale, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ─── action animations ────────────────────────────────────────────────────
  useEffect(() => {
    // stop all
    [eyeScaleY, mouthHeight, leftHandRot, rightHandRot, antennaPulse, zzzOpacity, zzzY]
      .forEach(v => v.stopAnimation());

    // reset
    mouthHeight.setValue(3);
    eyeScaleY.setValue(1);
    zzzOpacity.setValue(0);
    zzzY.setValue(0);

    if (currentAction === "idle") {
      // antenna slow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(antennaPulse, { toValue: 1,   duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(antennaPulse, { toValue: 0.3, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
      // gentle arm sway (counter-phase)
      Animated.loop(Animated.sequence([
        Animated.timing(leftHandRot,  { toValue:  1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(leftHandRot,  { toValue: -1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(rightHandRot, { toValue: -1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rightHandRot, { toValue:  1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
      // periodic blink
      const blink = () => {
        Animated.sequence([
          Animated.timing(eyeScaleY, { toValue: 0.08, duration: 70, useNativeDriver: true }),
          Animated.timing(eyeScaleY, { toValue: 1,    duration: 70, useNativeDriver: true }),
        ]).start();
      };
      const id = setInterval(blink, 3200);
      return () => clearInterval(id);
    }

    if (currentAction === "sleep") {
      // squint eyes shut
      Animated.timing(eyeScaleY, { toValue: 0.1, duration: 500, useNativeDriver: true }).start();
      // arms droop
      Animated.timing(leftHandRot,  { toValue:  6, duration: 700, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }).start();
      Animated.timing(rightHandRot, { toValue: -6, duration: 700, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }).start();
      // dim antenna
      Animated.timing(antennaPulse, { toValue: 0.15, duration: 600, useNativeDriver: true }).start();
      // floating zzz loop
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(zzzOpacity, { toValue: 1,     duration: 300,            useNativeDriver: true }),
            Animated.timing(zzzY,       { toValue: 0,     duration: 1,              useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(zzzOpacity, { toValue: 0,   duration: duration * 0.65, easing: Easing.in(Easing.ease), useNativeDriver: true }),
            Animated.timing(zzzY,       { toValue: -40, duration: duration * 0.65, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.delay(duration * 0.35),
        ])
      ).start();
    }

    if (currentAction === "yawn") {
      // mouth opens wide then closes
      Animated.sequence([
        Animated.timing(mouthHeight, { toValue: 22, duration: duration * 0.35, easing: Easing.out(Easing.back(1.6)), useNativeDriver: false }),
        Animated.delay(duration * 0.25),
        Animated.timing(mouthHeight, { toValue: 3,  duration: duration * 0.4,  easing: Easing.inOut(Easing.ease),   useNativeDriver: false }),
      ]).start();
      // arms raise then fall
      Animated.sequence([
        Animated.parallel([
          Animated.timing(leftHandRot,  { toValue: -9, duration: duration * 0.4, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(rightHandRot, { toValue:  9, duration: duration * 0.4, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.delay(duration * 0.2),
        Animated.parallel([
          Animated.timing(leftHandRot,  { toValue: 0, duration: duration * 0.4, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(rightHandRot, { toValue: 0, duration: duration * 0.4, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ]).start();
      // antenna rapid flicker then settle
      Animated.loop(
        Animated.sequence([
          Animated.timing(antennaPulse, { toValue: 1,   duration: 180, useNativeDriver: true }),
          Animated.timing(antennaPulse, { toValue: 0.2, duration: 180, useNativeDriver: true }),
        ]),
        { iterations: Math.ceil(duration / 360) }
      ).start(() => Animated.timing(antennaPulse, { toValue: 0.6, duration: 300, useNativeDriver: true }).start());
      // half-blink mid yawn
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(eyeScaleY, { toValue: 0.35, duration: 120, useNativeDriver: true }),
          Animated.timing(eyeScaleY, { toValue: 1,    duration: 120, useNativeDriver: true }),
        ]).start();
      }, duration * 0.45);
    }
  }, [action, currentAction, duration]);

  const leftRot  = leftHandRot.interpolate({ inputRange: [-10, 10], outputRange: ["-30deg", "30deg"] });
  const rightRot = rightHandRot.interpolate({ inputRange: [-10, 10], outputRange: ["-30deg", "30deg"] });

  // core light colours by action
  const lightA = currentAction === "sleep" ? t.muted : currentAction === "yawn" ? t.primary : t.fg;
  const lightB = currentAction === "sleep" ? t.muted : currentAction === "yawn" ? t.muted : t.primary;

  return (
    <View style={[styles.root, { backgroundColor: t.pageBg }]}>
      <View style={styles.panel}>
        <Text style={[styles.panelLabel, { color: t.mutedFg }]}>Action</Text>
        <View style={styles.panelRow}>
          {ACTIONS.map((item) => (
            <Pressable key={item} onPress={() => setCurrentAction(item)} style={[styles.chip, { backgroundColor: currentAction === item ? t.primary : t.muted, borderColor: t.border }]}>
              <Text style={[styles.chipText, { color: currentAction === item ? t.background : t.foreground }]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Animated.View style={[styles.shadow, { backgroundColor: t.border, transform: [{ scaleX: shadowScale }] }]} />

      <Animated.View style={[styles.robot, { transform: [{ translateY: levitate }] }]}>

        {/* ZZZ */}
        <Animated.Text style={[styles.zzz, { color: t.mutedFg, opacity: zzzOpacity, transform: [{ translateY: zzzY }] }]}>
          z z z
        </Animated.Text>

        {/* ── ANTENNA ── */}
        <View style={styles.antennaCol}>
          <Animated.View style={[styles.antennaDot, { backgroundColor: t.primary, borderColor: t.border, opacity: antennaPulse }]} />
          <View style={[styles.antennaStem, { backgroundColor: t.surface, borderColor: t.border }]} />
        </View>

        {/* ── HEAD ── */}
        <View style={[styles.head, { backgroundColor: t.bg, borderColor: t.border }]}>
          {/* ear bolts */}
          <View style={[styles.boltLeft,  { backgroundColor: t.surface, borderColor: t.border }]} />
          <View style={[styles.boltRight, { backgroundColor: t.surface, borderColor: t.border }]} />

          <View style={styles.eyeRow}>
            <Animated.View style={[styles.eye, { backgroundColor: t.fg, borderColor: t.border, transform: [{ scaleY: eyeScaleY }] }]} />
            <Animated.View style={[styles.eye, { backgroundColor: t.fg, borderColor: t.border, transform: [{ scaleY: eyeScaleY }] }]} />
          </View>

          {/* mouth */}
          <Animated.View style={[styles.mouth, { backgroundColor: t.surface, borderColor: t.border, height: mouthHeight }]} />
        </View>

        {/* ── ARMS + CORE ── */}
        <View style={styles.bodyRow}>

          {/* left arm */}
          <Animated.View style={[styles.arm, { backgroundColor: t.bg, borderColor: t.border, transformOrigin: "50% 0%", transform: [{ rotate: leftRot }] }]}>
            <View style={[styles.hand, { backgroundColor: t.surface, borderColor: t.border }]} />
          </Animated.View>

          {/* core */}
          <View style={[styles.core, { backgroundColor: t.bg, borderColor: t.border }]}>
            {/* vent lines */}
            <View style={styles.ventRow}>
              {[0,1,2].map(i => (
                <View key={i} style={[styles.vent, { backgroundColor: t.surface, borderColor: t.border }]} />
              ))}
            </View>
            {/* indicator lights */}
            <View style={styles.lightRow}>
              <View style={[styles.light, { backgroundColor: lightA, borderColor: t.border }]} />
              <View style={[styles.light, { backgroundColor: lightB, borderColor: t.border }]} />
            </View>
          </View>

          {/* right arm */}
          <Animated.View style={[styles.arm, { backgroundColor: t.bg, borderColor: t.border, transformOrigin: "50% 0%", transform: [{ rotate: rightRot }] }]}>
            <View style={[styles.hand, { backgroundColor: t.surface, borderColor: t.border }]} />
          </Animated.View>
        </View>

      </Animated.View>
    </View>
  );
}

export default function SpriteScreen() {
  return <GamificationSpriteScreen action="idle" />;
}

// ─── layout constants ────────────────────────────────────────────────────────
const BORDER = 2;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    padding: 16,
  },
  panel: {
    width: "100%",
    maxWidth: 360,
    gap: 10,
  },
  panelLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  panelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  chip: {
    borderWidth: BORDER,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  shadow: {
    position: "absolute",
    bottom: 32,
    width: 72,
    height: 8,
    borderRadius: 4,
    opacity: 0.25,
  },
  robot: {
    alignItems: "center",
  },

  // ZZZ
  zzz: {
    position: "absolute",
    top: -18,
    right: -28,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Satoshi",
    letterSpacing: 4,
  },

  // Antenna
  antennaCol: {
    alignItems: "center",
    marginBottom: -1,
    zIndex: 2,
  },
  antennaDot: {
    width: 10,
    height: 10,
    borderRadius: 2,          // sharp — matches your radius-sm: 2px
    borderWidth: BORDER,
  },
  antennaStem: {
    width: 4,
    height: 12,
    borderRadius: 0,
    borderWidth: BORDER,
    borderTopWidth: 0,
  },

  // Head
  head: {
    width: 96,
    height: 70,
    borderRadius: 4,           // radius-lg: 4px
    borderWidth: BORDER,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    position: "relative",
  },
  boltLeft: {
    position: "absolute",
    left: -7,
    top: "40%",
    width: 8,
    height: 8,
    borderRadius: 2,
    borderWidth: BORDER,
  },
  boltRight: {
    position: "absolute",
    right: -7,
    top: "40%",
    width: 8,
    height: 8,
    borderRadius: 2,
    borderWidth: BORDER,
  },
  eyeRow: {
    flexDirection: "row",
    gap: 12,
  },
  eye: {
    width: 22,
    height: 22,
    borderRadius: 3,          // radius-md: 3px — your card radius
    borderWidth: BORDER,
  },
  mouth: {
    width: 30,
    height: 3,
    borderRadius: 2,
    borderWidth: BORDER,
  },

  // Body
  bodyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 3,
  },

  // Arms
  arm: {
    width: 15,
    height: 46,
    borderRadius: 3,
    borderWidth: BORDER,
    alignItems: "center",
    justifyContent: "flex-end",
    marginHorizontal: 3,
  },
  hand: {
    width: 19,
    height: 19,
    borderRadius: 3,
    borderWidth: BORDER,
    marginBottom: -10,
  },

  // Core / torso
  core: {
    width: 62,
    height: 54,
    borderRadius: 3,
    borderWidth: BORDER,
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 8,
  },
  ventRow: {
    flexDirection: "row",
    gap: 4,
  },
  vent: {
    width: 12,
    height: 5,
    borderRadius: 1,
    borderWidth: 1,
  },
  lightRow: {
    flexDirection: "row",
    gap: 10,
  },
  light: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: BORDER,
  },
});
