import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

export type SpriteAction = "idle" | "sleep" | "yawn";

interface SpriteAnimationProps {
  action?: SpriteAction;
  size?: "sm" | "md" | "lg";
}

const C = {
  face: "#FFFFFF",
  faceShadow: "#F0F0F0",
  faceBorder: "#111111",
  cheek: "#E03030",

  eyeOuter: "#111111",
  eyeWhite: "#FFFFFF",
  pupil: "#111111",
  shineL: "#FFFFFF",
  shineS: "#FFFFFF",

  antennaBase: "#FFFFFF",
  antennaStem: "#111111",
  antennaTip: "#E03030",

  chest: "#111111",
  chestBorder: "#111111",
  lightRed: "#E03030",
  lightWhite: "#FFFFFF",

  hand: "#FFFFFF",
  handBorder: "#111111",
  knuckle: "#CCCCCC",

  zzz: "#E03030",
  shadow: "#222222",
};

const sineIO = Easing.inOut(Easing.sin);
const springOut = Easing.out(Easing.back(1.6));

const SCALES: Record<string, number> = {
  sm: 0.4,
  md: 0.7,
  lg: 1,
};

export function SpriteAnimation({
  action = "idle",
  size = "md",
}: SpriteAnimationProps) {
  const [currentAction, setCurrentAction] = useState<SpriteAction>(action);
  const scale = SCALES[size];

  useEffect(() => {
    setCurrentAction(action);
  }, [action]);

  const float = useRef(new Animated.Value(0)).current;
  const shadowScaleX = useRef(new Animated.Value(1)).current;
  const bodyTilt = useRef(new Animated.Value(0)).current;
  const pupilX = useRef(new Animated.Value(0)).current;
  const pupilY = useRef(new Animated.Value(0)).current;
  const eyeScale = useRef(new Animated.Value(1)).current;
  const lidScale = useRef(new Animated.Value(0)).current;
  const cheekOpacity = useRef(new Animated.Value(0)).current;
  const leftArmRot = useRef(new Animated.Value(0)).current;
  const rightArmRot = useRef(new Animated.Value(0)).current;
  const antGlow = useRef(new Animated.Value(0.5)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const zzzOpacity = useRef(new Animated.Value(0)).current;
  const zzzY = useRef(new Animated.Value(0)).current;
  const zzzScale = useRef(new Animated.Value(0.5)).current;
  const bodyJoltX = useRef(new Animated.Value(0)).current;
  const bodyJoltScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(float, {
            toValue: -11 * scale,
            duration: 1700,
            easing: sineIO,
            useNativeDriver: true,
          }),
          Animated.timing(shadowScaleX, {
            toValue: 0.7,
            duration: 1700,
            easing: sineIO,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(float, {
            toValue: 0,
            duration: 1700,
            easing: sineIO,
            useNativeDriver: true,
          }),
          Animated.timing(shadowScaleX, {
            toValue: 1,
            duration: 1700,
            easing: sineIO,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  const scheduleBlink = useCallback(() => {
    const delay = 2200 + Math.random() * 2000;
    return setTimeout(() => {
      const double = Math.random() > 0.65;
      Animated.sequence([
        Animated.timing(eyeScale, {
          toValue: 0.08,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(eyeScale, {
          toValue: 1,
          duration: 70,
          useNativeDriver: true,
        }),
        ...(double
          ? [
              Animated.delay(90),
              Animated.timing(eyeScale, {
                toValue: 0.08,
                duration: 60,
                useNativeDriver: true,
              }),
              Animated.timing(eyeScale, {
                toValue: 1,
                duration: 70,
                useNativeDriver: true,
              }),
            ]
          : []),
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
          Animated.timing(pupilX, {
            toValue: tx,
            duration: 180,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pupilY, {
            toValue: ty,
            duration: 180,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(600 + Math.random() * 800),
        Animated.parallel([
          Animated.timing(pupilX, {
            toValue: 0,
            duration: 180,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pupilY, {
            toValue: 0,
            duration: 180,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, delay);
  }, []);

  const scheduleTilt = useCallback(() => {
    const delay = 3000 + Math.random() * 3000;
    return setTimeout(() => {
      const angle = (Math.random() - 0.5) * 10;
      Animated.sequence([
        Animated.timing(bodyTilt, {
          toValue: angle,
          duration: 400,
          easing: sineIO,
          useNativeDriver: true,
        }),
        Animated.delay(800 + Math.random() * 600),
        Animated.timing(bodyTilt, {
          toValue: 0,
          duration: 400,
          easing: sineIO,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
  }, []);

  useEffect(() => {
    [
      lidScale,
      cheekOpacity,
      leftArmRot,
      rightArmRot,
      antGlow,
      heartScale,
      zzzOpacity,
      zzzY,
      zzzScale,
      bodyJoltX,
      bodyJoltScale,
      bodyTilt,
      pupilX,
      pupilY,
      eyeScale,
    ].forEach((v) => v.stopAnimation());

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

    if (currentAction === "idle") {
      cheekOpacity.setValue(0.45);

      Animated.loop(
        Animated.sequence([
          Animated.timing(antGlow, {
            toValue: 1,
            duration: 950,
            easing: sineIO,
            useNativeDriver: true,
          }),
          Animated.timing(antGlow, {
            toValue: 0.3,
            duration: 950,
            easing: sineIO,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(heartScale, {
            toValue: 1.4,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(heartScale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(heartScale, {
            toValue: 1.22,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(heartScale, {
            toValue: 1,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.delay(1400),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(leftArmRot, {
            toValue: 1.2,
            duration: 1900,
            easing: sineIO,
            useNativeDriver: true,
          }),
          Animated.timing(leftArmRot, {
            toValue: -1.2,
            duration: 1900,
            easing: sineIO,
            useNativeDriver: true,
          }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(rightArmRot, {
            toValue: -1.2,
            duration: 1900,
            easing: sineIO,
            useNativeDriver: true,
          }),
          Animated.timing(rightArmRot, {
            toValue: 1.2,
            duration: 1900,
            easing: sineIO,
            useNativeDriver: true,
          }),
        ])
      ).start();

      let blinkTimer: ReturnType<typeof setTimeout>;
      let glanceTimer: ReturnType<typeof setTimeout>;
      let tiltTimer: ReturnType<typeof setTimeout>;

      const loopBlink = () => {
        blinkTimer = scheduleBlink();
        blinkTimer && setTimeout(loopBlink, 5500);
      };
      const loopGlance = () => {
        glanceTimer = scheduleGlance();
        glanceTimer && setTimeout(loopGlance, 5000);
      };
      const loopTilt = () => {
        tiltTimer = scheduleTilt();
        tiltTimer && setTimeout(loopTilt, 7000);
      };

      const b1 = setTimeout(loopBlink, 200);
      const g1 = setTimeout(loopGlance, 1200);
      const t1 = setTimeout(loopTilt, 2400);

      return () => {
        clearTimeout(b1);
        clearTimeout(g1);
        clearTimeout(t1);
        clearTimeout(blinkTimer);
        clearTimeout(glanceTimer);
        clearTimeout(tiltTimer);
      };
    }

    if (currentAction === "sleep") {
      Animated.timing(lidScale, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      Animated.timing(cheekOpacity, {
        toValue: 0.18,
        duration: 600,
        useNativeDriver: true,
      }).start();

      Animated.parallel([
        Animated.timing(leftArmRot, {
          toValue: 5,
          duration: 800,
          easing: springOut,
          useNativeDriver: true,
        }),
        Animated.timing(rightArmRot, {
          toValue: -5,
          duration: 800,
          easing: springOut,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.timing(antGlow, {
        toValue: 0.1,
        duration: 900,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(heartScale, {
            toValue: 1.08,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(heartScale, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(2200),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(bodyTilt, {
            toValue: 6,
            duration: 2200,
            easing: sineIO,
            useNativeDriver: true,
          }),
          Animated.timing(bodyTilt, {
            toValue: -2,
            duration: 2200,
            easing: sineIO,
            useNativeDriver: true,
          }),
        ])
      ).start();

      const launchZzz = () => {
        zzzY.setValue(0);
        zzzScale.setValue(0.5);
        zzzOpacity.setValue(0);
        Animated.sequence([
          Animated.parallel([
            Animated.timing(zzzOpacity, {
              toValue: 1,
              duration: 280,
              useNativeDriver: true,
            }),
            Animated.timing(zzzY, {
              toValue: -58,
              duration: 2600 * 0.72,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(zzzScale, {
              toValue: 1.3,
              duration: 2600 * 0.72,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(zzzOpacity, {
            toValue: 0,
            duration: 260,
            useNativeDriver: true,
          }),
        ]).start();
      };
      launchZzz();
      const zId = setInterval(launchZzz, 2600 * 0.88);
      return () => clearInterval(zId);
    }

    if (currentAction === "yawn") {
      Animated.sequence([
        Animated.timing(bodyJoltScale, {
          toValue: 1.07,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(bodyJoltScale, {
          toValue: 1.0,
          duration: 220,
          easing: springOut,
          useNativeDriver: true,
        }),
      ]).start();
      Animated.sequence([
        Animated.timing(bodyJoltX, {
          toValue: -5,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(bodyJoltX, {
          toValue: 5,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(bodyJoltX, {
          toValue: 0,
          duration: 55,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.timing(cheekOpacity, {
        toValue: 0.8,
        duration: 280,
        useNativeDriver: true,
      }).start();

      Animated.sequence([
        Animated.timing(eyeScale, {
          toValue: 1.45,
          duration: 2600 * 0.2,
          easing: springOut,
          useNativeDriver: true,
        }),
        Animated.delay(2600 * 0.2),
        Animated.timing(eyeScale, {
          toValue: 0.45,
          duration: 2600 * 0.3,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(2600 * 0.1),
        Animated.timing(eyeScale, {
          toValue: 1.0,
          duration: 2600 * 0.2,
          easing: sineIO,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.sequence([
        Animated.parallel([
          Animated.timing(leftArmRot, {
            toValue: -8,
            duration: 2600 * 0.35,
            easing: springOut,
            useNativeDriver: true,
          }),
          Animated.timing(rightArmRot, {
            toValue: 8,
            duration: 2600 * 0.35,
            easing: springOut,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(2600 * 0.2),
        Animated.parallel([
          Animated.timing(leftArmRot, {
            toValue: 0,
            duration: 2600 * 0.45,
            easing: sineIO,
            useNativeDriver: true,
          }),
          Animated.timing(rightArmRot, {
            toValue: 0,
            duration: 2600 * 0.45,
            easing: sineIO,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      Animated.sequence([
        Animated.loop(
          Animated.sequence([
            Animated.timing(antGlow, {
              toValue: 1,
              duration: 110,
              useNativeDriver: true,
            }),
            Animated.timing(antGlow, {
              toValue: 0.1,
              duration: 110,
              useNativeDriver: true,
            }),
          ]),
          { iterations: Math.ceil((2600 * 0.4) / 220) }
        ),
        Animated.timing(antGlow, {
          toValue: 0.6,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.sequence([
        Animated.delay(2600 * 0.25),
        Animated.timing(bodyTilt, {
          toValue: 8,
          duration: 2600 * 0.45,
          easing: sineIO,
          useNativeDriver: true,
        }),
        Animated.timing(bodyTilt, {
          toValue: 0,
          duration: 2600 * 0.3,
          easing: sineIO,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [action, currentAction]);

  const leftRot = leftArmRot.interpolate({
    inputRange: [-10, 10],
    outputRange: ["-30deg", "30deg"],
  });
  const rightRot = rightArmRot.interpolate({
    inputRange: [-10, 10],
    outputRange: ["-30deg", "30deg"],
  });
  const bodyRot = bodyTilt.interpolate({
    inputRange: [-15, 15],
    outputRange: ["-15deg", "15deg"],
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.shadow,
          { transform: [{ scaleX: shadowScaleX }, { scale }] },
        ]}
      />
      <Animated.View
        style={[
          styles.robot,
          {
            transform: [
              { scale },
              { translateY: float },
              { translateX: bodyJoltX },
              { scaleX: bodyJoltScale },
              { scaleY: bodyJoltScale },
              { rotate: bodyRot },
            ],
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.zzz,
            {
              opacity: zzzOpacity,
              transform: [{ translateY: zzzY }, { scale: zzzScale }],
            },
          ]}
        >
          z z z
        </Animated.Text>

        <View style={styles.antennaWrap}>
          <Animated.View style={[styles.antennaTip, { opacity: antGlow }]} />
          <View style={styles.antennaStem} />
        </View>

        <View style={styles.head}>
          <View style={styles.earLeft} />
          <View style={styles.earRight} />

          <View style={styles.eyeRow}>
            <Animated.View
              style={[styles.eyeOuter, { transform: [{ scaleY: eyeScale }] }]}
            >
              <View style={styles.eyeWhiteCircle}>
                <Animated.View
                  style={[
                    styles.pupil,
                    {
                      transform: [
                        { translateX: pupilX },
                        { translateY: pupilY },
                      ],
                    },
                  ]}
                >
                  <View style={styles.shineL} />
                  <View style={styles.shineS} />
                </Animated.View>
                <Animated.View
                  style={[styles.eyelid, { transform: [{ scaleY: lidScale }] }]}
                />
              </View>
            </Animated.View>

            <Animated.View
              style={[styles.eyeOuter, { transform: [{ scaleY: eyeScale }] }]}
            >
              <View style={styles.eyeWhiteCircle}>
                <Animated.View
                  style={[
                    styles.pupil,
                    {
                      transform: [
                        { translateX: pupilX },
                        { translateY: pupilY },
                      ],
                    },
                  ]}
                >
                  <View style={styles.shineL} />
                  <View style={styles.shineS} />
                </Animated.View>
                <Animated.View
                  style={[styles.eyelid, { transform: [{ scaleY: lidScale }] }]}
                />
              </View>
            </Animated.View>
          </View>

          <Animated.View style={[styles.cheekL, { opacity: cheekOpacity }]} />
          <Animated.View style={[styles.cheekR, { opacity: cheekOpacity }]} />
        </View>

        <View style={styles.bodyRow}>
          <Animated.View
            style={[
              styles.handWrap,
              {
                transform: [{ rotate: leftRot }],
                transformOrigin: "50% 15%",
              },
            ]}
          >
            <View style={styles.hand}>
              <View style={styles.knuckles}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.knuckle} />
                ))}
              </View>
            </View>
          </Animated.View>

          <View style={styles.chest}>
            <View style={styles.lightRow}>
              <Animated.View
                style={[
                  styles.lightDot,
                  {
                    backgroundColor: C.lightRed,
                    transform: [{ scale: heartScale }],
                  },
                ]}
              />
              <View
                style={[styles.lightDot, { backgroundColor: C.lightWhite }]}
              />
            </View>
            <View style={styles.ventRow}>
              <View style={styles.vent} />
              <View style={styles.vent} />
            </View>
          </View>

          <Animated.View
            style={[
              styles.handWrap,
              {
                transform: [{ rotate: rightRot }],
                transformOrigin: "50% 15%",
              },
            ]}
          >
            <View style={styles.hand}>
              <View style={styles.knuckles}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.knuckle} />
                ))}
              </View>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const B = 2.5;
const EYE_OUTER = 44;
const EYE_WHITE = 36;
const PUPIL_R = 22;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  shadow: {
    position: "absolute",
    bottom: 30,
    width: 66,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#333333",
    opacity: 0.18,
  },
  robot: { alignItems: "center" },
  zzz: {
    position: "absolute",
    top: -22,
    right: -40,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 5,
    color: C.zzz,
  },
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
  head: {
    width: 124,
    height: 100,
    borderRadius: 28,
    borderWidth: B,
    borderColor: C.faceBorder,
    backgroundColor: C.face,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
    position: "relative",
    overflow: "visible",
  },
  earLeft: {
    position: "absolute",
    left: -12,
    top: "32%",
    width: 14,
    height: 22,
    borderRadius: 6,
    borderWidth: B,
    borderColor: C.faceBorder,
    backgroundColor: C.face,
  },
  earRight: {
    position: "absolute",
    right: -12,
    top: "32%",
    width: 14,
    height: 22,
    borderRadius: 6,
    borderWidth: B,
    borderColor: C.faceBorder,
    backgroundColor: C.face,
  },
  eyeRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  eyeOuter: {
    width: EYE_OUTER,
    height: EYE_OUTER,
    borderRadius: EYE_OUTER / 2,
    backgroundColor: C.eyeOuter,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
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
  shineL: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    opacity: 0.96,
  },
  shineS: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
    opacity: 0.72,
    marginTop: 2,
  },
  eyelid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: EYE_WHITE,
    borderRadius: EYE_WHITE / 2,
    backgroundColor: C.face,
    transformOrigin: "50% 0%",
  },
  cheekL: {
    position: "absolute",
    left: 8,
    bottom: 12,
    width: 24,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.cheek,
  },
  cheekR: {
    position: "absolute",
    right: 8,
    bottom: 12,
    width: 24,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.cheek,
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    gap: 5,
  },
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
  knuckle: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.knuckle,
  },
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
