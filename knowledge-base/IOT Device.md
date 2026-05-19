# IoT Wearable Health Monitoring Device
## Complete Component Pricing - Sri Lanka (2026)

---

## PROJECT OVERVIEW
A Bluetooth-enabled wearable health monitoring device with:
- **ECG/Heart Rate Monitoring** (ADS1292R or MAX30102)
- **Oxygen Saturation (SpO2)** (MAX30102)
- **Motion/Acceleration Tracking** (MPU-6050)
- **Galvanic Skin Response (Optional)** (GSR/EDA Sensor)
- **Wireless Connectivity** (ESP32 with BLE)
- **Data Storage** (On-board SD card or internal flash)
- **USB Interface** (Type-C for firmware upload & charging)
- **Battery-Powered** (Rechargeable 18650 Lithium)

---

## COMPONENT BREAKDOWN & PRICING

### **CORE MICROCONTROLLER & CONNECTIVITY**

| Component | Store | Price (LKR) | Notes |
|-----------|-------|-----------|-------|
| **ESP32 Dev Board (30-pin with Type-C)** | Alphatronic | ~2,500-3,500 | Built-in WiFi + BLE, CP2102 USB bridge, Dual-core 240MHz |
| **ESP32 Dev Board (Micro USB)** | Duino.lk | ~2,000-2,500 | Alternative with Micro USB |
| **ESP32 S3 DevKit** | Alphatronic | ~3,500-4,500 | Newer model with enhanced features |

**RECOMMENDED:** ESP32 with Type-C (Alphatronic) - **~Rs. 3,000** (Best for modern connectivity)

---

### **BIOMETRIC SENSORS**

#### Option A: Combined MAX30102 + Additional ECG (ADS1292R)
| Component | Store | Price (LKR) | Purpose |
|-----------|-------|-----------|---------|
| **MAX30102 Heart Rate & SpO2 Sensor** | Duino.lk / Alphatronic / LK-Tronics | 1,200-1,800 | Heart rate + Blood oxygen (PPG) |
| **ADS1292R ECG Breakout Board** | Tronic.lk | ~8,000-10,000 | Professional-grade ECG (includes electrodes) |

#### Option B: MAX30102 Only (Simpler Solution)
| Component | Store | Price (LKR) | Purpose |
|-----------|-------|-----------|---------|
| **MAX30102 Heart Rate & SpO2** | Duino.lk / Alphatronic | 1,200-1,800 | Single sensor for HR + SpO2 |

#### **MOTION TRACKING**

| Component | Store | Price (LKR) | Purpose |
|-----------|-------|-----------|---------|
| **MPU-6050 (GY-521 Module)** | Alphatronic / Duino.lk / LK-Tronics | 650-850 | 6-axis: 3-axis accelerometer + 3-axis gyroscope |

#### **GALVANIC SKIN RESPONSE (OPTIONAL)**

| Component | Store | Price (LKR) | Purpose |
|-----------|-------|-----------|---------|
| **Grove GSR Module** / **ProtoCentral tinyGSR** | International retailers | 3,000-6,000 | Stress/emotion measurement (Not readily available in SL) |
| **DIY GSR Breakout (Budget)** | N/A | 1,500-2,500 | Self-built version |

**NOTE:** GSR sensors are limited in Sri Lankan stock. Consider importing or DIY.

---

### **POWER SYSTEM**

| Component | Store | Price (LKR) | Capacity/Rating |
|-----------|-------|-----------|---------|
| **18650 Lithium Battery (3.7V, 3200mAh)** | Alphatronic / Tronic.lk / Nilambara | 400-700 | Rechargeable, ~7-10hr runtime (depends on usage) |
| **18650 Lithium Battery (3.7V, 2200mAh)** | Alphatronic / Tronic.lk | 350-500 | Smaller capacity, lighter weight |
| **Battery Holder (Single 18650)** | Alphatronic / Duino.lk | 150-300 | Spring-contact holder with leads |
| **TP4056 Charging Module** | Tronic.lk / Duino.lk | 300-500 | USB charging controller for 18650 |
| **MB102 Power Supply Board** | Alphatronic | 200-400 | Multi-voltage regulation (3.3V, 5V) |

**RECOMMENDED SETUP:**
- **3200mAh 18650 Battery** - Rs. 500
- **TP4056 Charging Module** - Rs. 400
- **Battery Holder** - Rs. 250

**Power Subtotal: Rs. 1,150**

---

### **CONNECTIVITY & DATA TRANSFER**

| Component | Store | Price (LKR) | Purpose |
|-----------|-------|-----------|---------|
| **USB Type-C Cable (1m)** | Alphatronic / OTC.lk | 200-400 | Firmware upload & charging |
| **Micro USB Cable (1m)** | Alphatronic | 150-300 | Alternative (if using older ESP32) |

**RECOMMENDED:** USB Type-C Cable - **Rs. 300**

---

### **STORAGE & DATA LOGGING**

| Component | Store | Price (LKR) | Notes |
|-----------|-------|-----------|-------|
| **microSD Card (32GB)** | Various retailers | 800-1,500 | Optional for local data logging |
| **microSD Card Module** | Duino.lk / Alphatronic | 400-700 | SPI interface for data logging |

**OPTIONAL: Rs. 1,200 (if data logging needed)**

---

### **SUPPORT COMPONENTS & ACCESSORIES**

| Item | Store | Price (LKR) | Qty |
|------|-------|-----------|-----|
| **Breadboard (830 holes)** | Duino.lk | 200-350 | 1 |
| **Jumper Wires (40-pack)** | Duino.lk | 100-200 | 1 |
| **Male-Female Header Pins** | Duino.lk | 100-150 | As needed |
| **Push Buttons** | Duino.lk | 50-100 | 2-3 |
| **LEDs (Red, Green, Blue)** | Duino.lk | 50-100 | 5-10 |
| **Resistors Assortment** | Duino.lk | 100-200 | 1 set |
| **Capacitors Assortment** | Duino.lk | 100-200 | 1 set |

**Support Components Subtotal: Rs. 800-1,200**

---

## TOTAL COST BREAKDOWN

### **SCENARIO 1: BUDGET SETUP (MAX30102 + MPU-6050 Only)**
```
Component                          Price (LKR)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESP32 Dev Board (Type-C)           3,000
MAX30102 Sensor                    1,500
MPU-6050 Sensor                    750
18650 Battery (3200mAh)            500
TP4056 Charging Module             400
Battery Holder                     250
USB Type-C Cable                   300
Breadboard & Jumpers               400
Resistors, Capacitors, LEDs        300
Push Buttons & Misc                200
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL (Budget)                    Rs. 7,600
```

### **SCENARIO 2: PROFESSIONAL SETUP (ADS1292R + MAX30102 + MPU-6050)**
```
Component                          Price (LKR)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESP32 Dev Board (Type-C)           3,000
ADS1292R ECG Breakout Board        9,000
MAX30102 Sensor                    1,500
MPU-6050 Sensor                    750
18650 Battery (3200mAh)            500
TP4056 Charging Module             400
Battery Holder                     250
USB Type-C Cable                   300
Breadboard & Jumpers               400
Resistors, Capacitors, LEDs        300
Push Buttons & Misc                200
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL (Professional)              Rs. 16,200
```

### **SCENARIO 3: PREMIUM SETUP (+ GSR + Data Logging)**
```
Component                          Price (LKR)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESP32 Dev Board (Type-C)           3,000
ADS1292R ECG Breakout Board        9,000
MAX30102 Sensor                    1,500
MPU-6050 Sensor                    750
GSR/EDA Sensor Module              4,000
18650 Battery (3200mAh)            500
TP4056 Charging Module             400
Battery Holder                     250
USB Type-C Cable                   300
microSD Card Module                600
microSD Card (32GB)                1,200
Breadboard & Jumpers               400
Resistors, Capacitors, LEDs        300
Push Buttons & Misc                200
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL (Premium)                   Rs. 22,000
```

---

## RECOMMENDED CONFIGURATION

**Best Balance of Cost & Features:**

```
FINAL RECOMMENDED BUILD (Rs. 8,500-9,500)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ESP32 Dev Board (Type-C)         Rs. 3,000
   ✓ Built-in Bluetooth LE
   ✓ WiFi connectivity
   ✓ USB Type-C for firmware + charging
   ✓ 520KB SRAM, 4MB Flash

2. MAX30102 Heart Rate Sensor       Rs. 1,500
   ✓ SpO2 (blood oxygen) measurement
   ✓ Heart rate detection
   ✓ PPG (photoplethysmography)
   ✓ I2C interface
   ✓ Low power consumption

3. MPU-6050 IMU                     Rs. 750
   ✓ 3-axis accelerometer
   ✓ 3-axis gyroscope
   ✓ Motion tracking
   ✓ I2C interface
   ✓ 16-bit resolution

4. 18650 Battery System             Rs. 1,150
   ✓ 3.7V, 3200mAh Lithium battery
   ✓ TP4056 charging controller
   ✓ Battery holder with leads
   ✓ ~8-10 hours runtime

5. Connectivity & Data Transfer     Rs. 300
   ✓ USB Type-C cable (1m)

6. Support Components               Rs. 1,000
   ✓ Breadboard, jumpers, resistors
   ✓ LEDs, buttons, capacitors
   ✓ Headers and connectors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESTIMATED TOTAL:               Rs. 7,700
```

---

## SHOPPING LIST (WHERE TO BUY)

### **Recommended Sri Lankan Retailers**

1. **Alphatronic.lk**
   - Contact: +94 76 765 8217
   - Best for: ESP32, MPU-6050, Battery, Cables
   - Delivery: 2-4 days island-wide

2. **Duino.lk**
   - WhatsApp: 071 21 21 767 (Showroom contact)
   - Web: 0710 360 355
   - Best for: Sensors, Modules, Breadboards, Wire
   - Delivery: 2-4 days

3. **Tronic.lk**
   - Phone: 076 4485607 / 0112 199744
   - Best for: ADS1292R, Charging modules, Components
   - Delivery: 2-4 days

4. **LK-Tronics.com**
   - Specialty sensors and detailed specs
   - Good for: MAX30102, specifications

5. **Daraz.lk**
   - Best for: Multiple seller options, quick delivery
   - Tip: Filter by "Local Seller" for faster delivery

---

## ASSEMBLY & WIRING GUIDE

### **Basic Pin Connections**

```
ESP32 ← MAX30102 (I2C)
├─ GPIO 21 (SDA)
├─ GPIO 22 (SCL)
├─ 3.3V
└─ GND

ESP32 ← MPU-6050 (I2C)
├─ GPIO 21 (SDA)  [shared with MAX30102]
├─ GPIO 22 (SCL)  [shared with MAX30102]
├─ 3.3V
└─ GND

ESP32 ← TP4056 Charging Module
├─ GPIO 34 (ADC) - Battery voltage monitoring
├─ GND
└─ 5V (from USB)

Battery ← TP4056
├─ Positive → TP4056 B+
└─ Negative → TP4056 B-

TP4056 Output → ESP32 & Sensors
├─ OUT+ → 3.3V (via voltage regulator if needed)
└─ OUT- → GND
```

---

## SOFTWARE SETUP

### **Required Arduino Libraries**
- ESP32 Board Support Package (Arduino IDE)
- SparkFun MAX30102 Library
- MPU6050 Library (by Jeff Rowberg)
- Bluetooth LE Library (built-in)

### **Key Features to Implement**
1. **I2C Communication** - Multi-sensor polling
2. **Bluetooth LE (BLE) Server** - Send data to smartphone
3. **Data Buffering** - Store in SPIFFS or SD card
4. **Battery Monitoring** - ADC voltage reading
5. **Firmware Over-The-Air (OTA)** - USB Type-C updates

---

## ESTIMATED RUNTIME & POWER SPECS

| Metric | Value |
|--------|-------|
| Battery Capacity | 3200 mAh @ 3.7V |
| Energy Content | ~11.84 Wh |
| ESP32 Active Current | ~80-100 mA |
| ESP32 BLE Idle | ~10 mA |
| MAX30102 Active | ~1-2 mA |
| MPU-6050 Active | ~3-4 mA |
| **Total Active (All Sensors + ESP)** | ~90-110 mA |
| **Estimated Runtime** | ~6-8 hours (continuous) |
| **Standby (BLE Only)** | ~30-50 hours |

---

## NEXT STEPS

1. **Purchase core components** (ESP32, MAX30102, MPU-6050) from local retailers
2. **Set up Arduino IDE** with ESP32 board support
3. **Create prototype** on breadboard first
4. **Test each sensor individually** before integration
5. **Implement Bluetooth LE** communication
6. **Develop mobile app** (Flutter/React Native recommended)
7. **PCB design & soldering** (after successful breadboard test)
8. **Enclosure design** (3D printable case)
9. **Beta testing** with actual users
10. **Add GSR sensor** if required (advanced stage)

---

## COST COMPARISON

| Configuration | Total Cost | Best For |
|---------------|-----------|----------|
| Budget (HR + SpO2 + Motion) | Rs. 7,600-8,500 | Hobbyist/Educational |
| Professional (+ ECG) | Rs. 16,000-17,000 | Medical Research |
| Premium (+ GSR + Data Logging) | Rs. 22,000-23,000 | Clinical/Professional |

---

**Last Updated:** May 2026  
**Currency:** Sri Lankan Rupees (LKR)  
**Prices Subject to Change:** Check with retailers for current pricing
