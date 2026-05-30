import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useThemeColor } from "@/utils/theme";

// ─── types ─────────────────────
type SpriteAction = "idle" | "sleep" | "yawn";
const ACTIONS: SpriteAction[] = ["idle", "sleep", "yawn"];

interface SpriteProps {
  action: SpriteAction;
  duration?: number;
}

// ─── palette: red · white · black ────────────────────────────────────────────
const C = {
  face:         "#FFFFFF",   // crisp white face
  faceShadow:   "#F0F0F0",   // very subtle depth
  faceBorder:   "#111111",   // black border
  cheek:        "#E03030",   // red blush

  eyeOuter:     "#111111",   // black socket ring
  eyeWhite:     "#FFFFFF",
  pupil:        "#111111",   // black pupil
  shineL:       "#FFFFFF",   // large shine
  shineS:       "#FFFFFF",   // small shine

  antennaBase:  "#FFFFFF",
  antennaStem:  "#111111",
  antennaTip:   "#E03030",   // red tip

  chest:        "#111111",   // black chest
  chestBorder:  "#111111",
  lightRed:     "#E03030",
  lightWhite:   "#FFFFFF",

  hand:         "#FFFFFF",
  handBorder:   "#111111",
  knuckle:      "#CCCCCC",

  zzz:          "#E03030",
  shadow:       "#222222",
};

const sineIO = Easing.inOut(Easing.sin);
const springOut = Easing.out(Easing.back(1.6));

// ─── Chibi Robot ───────────────
function GamificationSpriteScreen({ action, duration = 2600 }: SpriteProps) {
  const [currentAction, setCurrentAction] = useState<SpriteAction>(action);
  const colors = useThemeColor();

  useEffect(() => { setCurrentAction(action); }, [action]);

  // ── animated values ─────────
  const float        = useRef(new Animated.Value(0)).current;
  const shadowScaleX = useRef(new Animated.Value(1)).current;

  // whole body tilt (idle personality)
  const bodyTilt     = useRef(new Animated.Value(0)).current;
  // random look: pupil offset
  const pupilX       = useRef(new Animated.Value(0)).current;
  const pupilY       = useRef(new Animated.Value(0)).current;
  // eye scale — used for yawn wide eyes + blink
  const eyeScale     = useRef(new Animated.Value(1)).current;
  // eyelid close (sleep)
  const lidScale     = useRef(new Animated.Value(0)).current;
  // cheek blush
  const cheekOpacity = useRef(new Animated.Value(0)).current;
  // arms
  const leftArmRot   = useRef(new Animated.Value(0)).current;
  const rightArmRot  = useRef(new Animated.Value(0)).current;
  // antenna glow
  const antGlow      = useRef(new Animated.Value(0.5)).current;
  // heartbeat light
  const heartScale   = useRef(new Animated.Value(1)).current;
  // zzz
  const zzzOpacity   = useRef(new Animated.Value(0)).current;
  const zzzY         = useRef(new Animated.Value(0)).current;
  const zzzScale     = useRef(new Animated.Value(0.5)).current;
  // yawn body jolt
  const bodyJoltX    = useRef(new Animated.Value(0)).current;
  const bodyJoltScale= useRef(new Animated.Value(1)).current;

  // ── perpetual float ─────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(float,        { toValue: -11, duration: 1700, easing: sineIO, useNativeDriver: true }),
          Animated.timing(shadowScaleX, { toValue: 0.70, duration: 1700, easing: sineIO, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(float,        { toValue: 0,  duration: 1700, easing: sineIO, useNativeDriver: true }),
          Animated.timing(shadowScaleX, { toValue: 1,  duration: 1700, easing: sineIO, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ── helper: random blink ────
  const scheduleBlink = useCallback(() => {
    const delay = 2200 + Math.random() * 2000;
    return setTimeout(() => {
      // double blink sometimes
      const double = Math.random() > 0.65;
      Animated.sequence([
        Animated.timing(eyeScale, { toValue: 0.08, duration: 60, useNativeDriver: true }),
        Animated.timing(eyeScale, { toValue: 1,    duration: 70, useNativeDriver: true }),
        ...(double ? [
          Animated.delay(90),
          Animated.timing(eyeScale, { toValue: 0.08, duration: 60, useNativeDriver: true }),
          Animated.timing(eyeScale, { toValue: 1,    duration: 70, useNativeDriver: true }),
        ] : []),
      ]).start();
    }, delay);
  }, []);

  const scheduleGlance = useCallback(() => {
    const delay = 1800 + Math.random() * 2800;
    return setTimeout(() => {
      const tx = (Math.random() - 0.5) * 10;
      const ty = (Math.random() - 0.5) * 6;
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pupilX, { toValue: tx, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pupilY, { toValue: ty, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.delay(600 + Math.random() * 800),
        Animated.parallel([
          Animated.timing(pupilX, { toValue: 0, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pupilY, { toValue: 0, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
      ]).start();
    }, delay);
  }, []);

  // ── helper: random body tilt
  const scheduleTilt = useCallback(() => {
    const delay = 3000 + Math.random() * 3000;
    return setTimeout(() => {
      const angle = (Math.random() - 0.5) * 10;
      Animated.sequence([
        Animated.timing(bodyTilt, { toValue: angle, duration: 400, easing: sineIO, useNativeDriver: true }),
        Animated.delay(800 + Math.random() * 600),
        Animated.timing(bodyTilt, { toValue: 0,     duration: 400, easing: sineIO, useNativeDriver: true }),
      ]).start();
    }, delay);
  }, []);

  // ── action animations ───────
  useEffect(() => {
    [lidScale, cheekOpacity, leftArmRot, rightArmRot, antGlow,
     heartScale, zzzOpacity, zzzY, zzzScale, bodyJoltX, bodyJoltScale,
     bodyTilt, pupilX, pupilY, eyeScale]
      .forEach((v) => v.stopAnimation());

    // resets
    lidScale.setValue(0);
    eyeScale.setValue(1);
    zzzOpacity.setValue(0);
    zzzY.setValue(0);
    zzzScale.setValue(0.5);
    bodyJoltX.setValue(0);
    bodyJoltScale.setValue(1);
    pupilX.setValue(0);
    pupilY.setValue(0);
    bodyTilt.setValue(0);

    // ── IDLE ───────────────────
    if (currentAction === "idle") {
      cheekOpacity.setValue(0.45);

      // antenna slow pulse
      Animated.loop(Animated.sequence([
        Animated.timing(antGlow, { toValue: 1,   duration: 950, easing: sineIO, useNativeDriver: true }),
        Animated.timing(antGlow, { toValue: 0.3, duration: 950, easing: sineIO, useNativeDriver: true }),
      ])).start();

      // heartbeat
      Animated.loop(Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.4,  duration: 150, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1,    duration: 150, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1.22, duration: 110, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1,    duration: 110, useNativeDriver: true }),
        Animated.delay(1400),
      ])).start();

      // arms gentle sway
      Animated.loop(Animated.sequence([
        Animated.timing(leftArmRot,  { toValue:  1.2, duration: 1900, easing: sineIO, useNativeDriver: true }),
        Animated.timing(leftArmRot,  { toValue: -1.2, duration: 1900, easing: sineIO, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(rightArmRot, { toValue: -1.2, duration: 1900, easing: sineIO, useNativeDriver: true }),
        Animated.timing(rightArmRot, { toValue:  1.2, duration: 1900, easing: sineIO, useNativeDriver: true }),
      ])).start();

      // random events in a chain
      let blinkTimer: ReturnType<typeof setTimeout>;
      let glanceTimer: ReturnType<typeof setTimeout>;
      let tiltTimer: ReturnType<typeof setTimeout>;

      const loopBlink  = () => { blinkTimer  = scheduleBlink();  blinkTimer  && setTimeout(loopBlink,  5500); };
      const loopGlance = () => { glanceTimer = scheduleGlance(); glanceTimer && setTimeout(loopGlance, 5000); };
      const loopTilt   = () => { tiltTimer   = scheduleTilt();   tiltTimer   && setTimeout(loopTilt,   7000); };

      // stagger starts so they don't all fire at once
      const b1 = setTimeout(loopBlink,  200);
      const g1 = setTimeout(loopGlance, 1200);
      const t1 = setTimeout(loopTilt,   2400);

      return () => {
        clearTimeout(b1); clearTimeout(g1); clearTimeout(t1);
        clearTimeout(blinkTimer); clearTimeout(glanceTimer); clearTimeout(tiltTimer);
      };
    }

    // ── SLEEP ───────────────────
    if (currentAction === "sleep") {
      // eyes close
      Animated.timing(lidScale, { toValue: 1, duration: 550, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();

      // cheeks dim
      Animated.timing(cheekOpacity, { toValue: 0.18, duration: 600, useNativeDriver: true }).start();

      // arms droop
      Animated.parallel([
        Animated.timing(leftArmRot,  { toValue:  5, duration: 800, easing: springOut, useNativeDriver: true }),
        Animated.timing(rightArmRot, { toValue: -5, duration: 800, easing: springOut, useNativeDriver: true }),
      ]).start();

      // dim antenna
      Animated.timing(antGlow, { toValue: 0.1, duration: 900, useNativeDriver: true }).start();

      // slow heartbeat
      Animated.loop(Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.08, duration: 350, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1,    duration: 350, useNativeDriver: true }),
        Animated.delay(2200),
      ])).start();

      // gentle side tilt while sleeping
      Animated.loop(Animated.sequence([
        Animated.timing(bodyTilt, { toValue:  6, duration: 2200, easing: sineIO, useNativeDriver: true }),
        Animated.timing(bodyTilt, { toValue: -2, duration: 2200, easing: sineIO, useNativeDriver: true }),
      ])).start();

      // zzz float
      const launchZzz = () => {
        zzzY.setValue(0);
        zzzScale.setValue(0.5);
        zzzOpacity.setValue(0);
        Animated.sequence([
          Animated.parallel([
            Animated.timing(zzzOpacity, { toValue: 1,   duration: 280,             useNativeDriver: true }),
            Animated.timing(zzzY,       { toValue: -58, duration: duration * 0.72, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(zzzScale,   { toValue: 1.3, duration: duration * 0.72, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.timing(zzzOpacity, { toValue: 0, duration: 260, useNativeDriver: true }),
        ]).start();
      };
      launchZzz();
      const zId = setInterval(launchZzz, duration * 0.88);
      return () => clearInterval(zId);
    }

    // ── YAWN ────────────────────
    if (currentAction === "yawn") {
      // body jolt — sudden little shake
      Animated.sequence([
        Animated.timing(bodyJoltScale, { toValue: 1.07, duration: 90,  useNativeDriver: true }),
        Animated.timing(bodyJoltScale, { toValue: 1.0,  duration: 220, easing: springOut, useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(bodyJoltX, { toValue: -5, duration: 55, useNativeDriver: true }),
        Animated.timing(bodyJoltX, { toValue:  5, duration: 55, useNativeDriver: true }),
        Animated.timing(bodyJoltX, { toValue:  0, duration: 55, useNativeDriver: true }),
      ]).start();

      // cheeks flush red
      Animated.timing(cheekOpacity, { toValue: 0.8, duration: 280, useNativeDriver: true }).start();

      // EYES: grow big (yawn wide-eye surprise) then half-close (drowsy)
      Animated.sequence([
        // 1. eyes pop wide open
        Animated.timing(eyeScale, { toValue: 1.45, duration: duration * 0.2, easing: springOut, useNativeDriver: true }),
        // 2. hold wide
        Animated.delay(duration * 0.2),
        // 3. squint to half-close (drowsy)
        Animated.timing(eyeScale, { toValue: 0.45, duration: duration * 0.3, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        // 4. hold drowsy
        Animated.delay(duration * 0.1),
        // 5. back to normal
        Animated.timing(eyeScale, { toValue: 1.0, duration: duration * 0.2, easing: sineIO, useNativeDriver: true }),
      ]).start();

      // arms stretch up then fall
      Animated.sequence([
        Animated.parallel([
          Animated.timing(leftArmRot,  { toValue: -8, duration: duration * 0.35, easing: springOut, useNativeDriver: true }),
          Animated.timing(rightArmRot, { toValue:  8, duration: duration * 0.35, easing: springOut, useNativeDriver: true }),
        ]),
        Animated.delay(duration * 0.2),
        Animated.parallel([
          Animated.timing(leftArmRot,  { toValue: 0, duration: duration * 0.45, easing: sineIO, useNativeDriver: true }),
          Animated.timing(rightArmRot, { toValue: 0, duration: duration * 0.45, easing: sineIO, useNativeDriver: true }),
        ]),
      ]).start();

      // antenna flicker then settle
      Animated.sequence([
        Animated.loop(Animated.sequence([
          Animated.timing(antGlow, { toValue: 1,   duration: 110, useNativeDriver: true }),
          Animated.timing(antGlow, { toValue: 0.1, duration: 110, useNativeDriver: true }),
        ]), { iterations: Math.ceil(duration * 0.4 / 220) }),
        Animated.timing(antGlow, { toValue: 0.6, duration: 320, useNativeDriver: true }),
      ]).start();

      // body lazily tilts to one side mid-yawn
      Animated.sequence([
        Animated.delay(duration * 0.25),
        Animated.timing(bodyTilt, { toValue: 8, duration: duration * 0.45, easing: sineIO, useNativeDriver: true }),
        Animated.timing(bodyTilt, { toValue: 0, duration: duration * 0.3,  easing: sineIO, useNativeDriver: true }),
      ]).start();
    }
  }, [action, currentAction, duration]);

  const leftRot  = leftArmRot.interpolate({ inputRange: [-10, 10], outputRange: ["-30deg", "30deg"] });
  const rightRot = rightArmRot.interpolate({ inputRange: [-10, 10], outputRange: ["-30deg", "30deg"] });
  const bodyRot  = bodyTilt.interpolate({ inputRange: [-15, 15], outputRange: ["-15deg", "15deg"] });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* action selector */}
      <View style={styles.panel}>
        <Text style={[styles.panelLabel, { color: colors.mutedForeground }]}>Action</Text>
        <View style={styles.chips}>
          {ACTIONS.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCurrentAction(item)}
              style={[
                styles.chip,
                {
                  backgroundColor: currentAction === item ? "#E03030" : "transparent",
                  borderColor: "#111111",
                },
              ]}
            >
              <Text style={[styles.chipText, { color: currentAction === item ? "#FFFFFF" : colors.foreground }]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* shadow */}
      <Animated.View style={[styles.shadow, { transform: [{ scaleX: shadowScaleX }] }]} />

      {/* robot (floats + tilts) */}
      <Animated.View
        style={[
          styles.robot,
          {
            transform: [
              { translateY: float },
              { translateX: bodyJoltX },
              { scale: bodyJoltScale },
              { rotate: bodyRot },
            ],
          },
        ]}
      >
        {/* ZZZ */}
        <Animated.Text
          style={[
            styles.zzz,
            { opacity: zzzOpacity, transform: [{ translateY: zzzY }, { scale: zzzScale }] },
          ]}
        >
          z z z
        </Animated.Text>

        {/* ANTENNA */}
        <View style={styles.antennaWrap}>
          <Animated.View style={[styles.antennaTip, { opacity: antGlow }]} />
          <View style={styles.antennaStem} />
        </View>

        {/* HEAD */}
        <View style={styles.head}>
          {/* ear stubs */}
          <View style={styles.earLeft} />
          <View style={styles.earRight} />

          {/* eyes */}
          <View style={styles.eyeRow}>
            {/* left eye */}
            <Animated.View style={[styles.eyeOuter, { transform: [{ scaleY: eyeScale }] }]}>
              <View style={styles.eyeWhiteCircle}>
                <Animated.View style={[styles.pupil, { transform: [{ translateX: pupilX }, { translateY: pupilY }] }]}>
                  {/* shine dots */}
                  <View style={styles.shineL} />
                  <View style={styles.shineS} />
                </Animated.View>
                {/* eyelid — wipes down from top */}
                <Animated.View
                  style={[styles.eyelid, { transform: [{ scaleY: lidScale }] }]}
                />
              </View>
            </Animated.View>

            {/* right eye */}
            <Animated.View style={[styles.eyeOuter, { transform: [{ scaleY: eyeScale }] }]}>
              <View style={styles.eyeWhiteCircle}>
                <Animated.View style={[styles.pupil, { transform: [{ translateX: pupilX }, { translateY: pupilY }] }]}>
                  <View style={styles.shineL} />
                  <View style={styles.shineS} />
                </Animated.View>
                <Animated.View
                  style={[styles.eyelid, { transform: [{ scaleY: lidScale }] }]}
                />
              </View>
            </Animated.View>
          </View>

          {/* cheeks */}
          <Animated.View style={[styles.cheekL, { opacity: cheekOpacity }]} />
          <Animated.View style={[styles.cheekR, { opacity: cheekOpacity }]} />
        </View>

        {/* ARMS + CHEST */}
        <View style={styles.bodyRow}>
          <Animated.View
            style={[styles.handWrap, { transform: [{ rotate: leftRot }], transformOrigin: "50% 15%" }]}
          >
            <View style={styles.hand}>
              <View style={styles.knuckles}>
                {[0, 1, 2].map((i) => <View key={i} style={styles.knuckle} />)}
              </View>
            </View>
          </Animated.View>

          {/* chest */}
          <View style={styles.chest}>
            <View style={styles.lightRow}>
              <Animated.View style={[styles.lightDot, { backgroundColor: C.lightRed, transform: [{ scale: heartScale }] }]} />
              <View style={[styles.lightDot, { backgroundColor: C.lightWhite }]} />
            </View>
            <View style={styles.ventRow}>
              <View style={styles.vent} />
              <View style={styles.vent} />
            </View>
          </View>

          <Animated.View
            style={[styles.handWrap, { transform: [{ rotate: rightRot }], transformOrigin: "50% 15%" }]}
          >
            <View style={styles.hand}>
              <View style={styles.knuckles}>
                {[0, 1, 2].map((i) => <View key={i} style={styles.knuckle} />)}
              </View>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

export default function SpriteScreen() {
  return <GamificationSpriteScreen action="idle" />;
}

// ─── styles ────────────────────
const B = 2.5;   // border width

// Eye geometry — bigger, cleaner, no inner ring
const EYE_OUTER   = 44;   // black circle
const EYE_WHITE   = 36;   // white inside
const PUPIL_R     = 22;   // black pupil circle

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingBottom: 48,
  },

  // selector
  panel: { alignItems: "center", gap: 10 },
  panelLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 2.5, textTransform: "uppercase" },
  chips: { flexDirection: "row", gap: 8 },
  chip: { borderWidth: B, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  chipText: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },

  // shadow
  shadow: {
    position: "absolute",
    bottom: 30,
    width: 66,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#333333",
    opacity: 0.18,
  },

  // robot
  robot: { alignItems: "center" },

  // zzz
  zzz: {
    position: "absolute",
    top: -22,
    right: -40,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 5,
    color: C.zzz,
  },

  // antenna
  antennaWrap: { alignItems: "center", marginBottom: -2, zIndex: 3 },
  antennaTip: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: C.antennaTip,
    borderWidth: B,
    borderColor: C.faceBorder,
  },
  antennaStem: {
    width: 5,
    height: 14,
    backgroundColor: C.antennaStem,
    borderWidth: B,
    borderTopWidth: 0,
    borderColor: C.faceBorder,
  },

  // head — big chibi round
  head: {
    width: 124,
    height: 100,
    borderRadius: 28,
    borderWidth: B,
    borderColor: C.faceBorder,
    backgroundColor: C.face,
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    paddingTop: 2,
    position: "relative",
    overflow: "visible",
  },
  earLeft: {
    position: "absolute", left: -12, top: "32%",
    width: 14, height: 22, borderRadius: 6,
    borderWidth: B, borderColor: C.faceBorder, backgroundColor: C.face,
  },
  earRight: {
    position: "absolute", right: -12, top: "32%",
    width: 14, height: 22, borderRadius: 6,
    borderWidth: B, borderColor: C.faceBorder, backgroundColor: C.face,
  },

  // eyes
  eyeRow: { flexDirection: "row", gap: 12, marginBottom: 4 },

  // black outer circle — clean, no ring inside
  eyeOuter: {
    width: EYE_OUTER,
    height: EYE_OUTER,
    borderRadius: EYE_OUTER / 2,
    backgroundColor: C.eyeOuter,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  // white inner circle
  eyeWhiteCircle: {
    width: EYE_WHITE,
    height: EYE_WHITE,
    borderRadius: EYE_WHITE / 2,
    backgroundColor: C.eyeWhite,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  // black pupil
  pupil: {
    width: PUPIL_R,
    height: PUPIL_R,
    borderRadius: PUPIL_R / 2,
    backgroundColor: C.pupil,
    position: "absolute",
    alignItems: "flex-end",
    paddingTop: 4,
    paddingRight: 3,
  },
  // large shine
  shineL: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#FFFFFF", opacity: 0.96 },
  // small shine offset below
  shineS: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#FFFFFF", opacity: 0.72, marginTop: 2 },
  // eyelid wipes from top (transformOrigin top)
  eyelid: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: EYE_WHITE,
    borderRadius: EYE_WHITE / 2,
    backgroundColor: C.face,   // white = face color — blends seamlessly
    transformOrigin: "50% 0%",
  },

  // cheek blushes — soft oval under eyes
  cheekL: {
    position: "absolute", left: 8, bottom: 12,
    width: 24, height: 10, borderRadius: 5,
    backgroundColor: C.cheek,
  },
  cheekR: {
    position: "absolute", right: 8, bottom: 12,
    width: 24, height: 10, borderRadius: 5,
    backgroundColor: C.cheek,
  },

  // arms + chest row
  bodyRow: { flexDirection: "row", alignItems: "center", marginTop: 7, gap: 5 },

  // floating hands
  handWrap: { alignItems: "center" },
  hand: {
    width: 34,
    height: 30,
    borderRadius: 10,
    borderWidth: B,
    borderColor: C.handBorder,
    backgroundColor: C.hand,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 5,
  },
  knuckles: { flexDirection: "row", gap: 3 },
  knuckle: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.knuckle },

  // chest
  chest: {
    width: 56,
    height: 44,
    borderRadius: 12,
    borderWidth: B,
    borderColor: C.chestBorder,
    backgroundColor: C.chest,
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 6,
  },
  lightRow: { flexDirection: "row", gap: 10 },
  lightDot: { width: 11, height: 11, borderRadius: 3 },
  ventRow: { flexDirection: "row", gap: 5 },
  vent: { width: 14, height: 4, borderRadius: 2, backgroundColor: "#333333" },
});
