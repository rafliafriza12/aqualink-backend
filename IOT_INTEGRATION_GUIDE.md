# IoT Connection Integration Guide

## Overview

Sistem koneksi IoT memungkinkan user menghubungkan device IoT mereka dengan meteran air untuk monitoring real-time. Sistem menggunakan mekanisme pairing code yang aman dengan Web Bluetooth API.

## Architecture

### Backend Components

#### 1. Models

**IoTConnection Model** (`/models/IoTConnection.js`)

```javascript
{
  userId: ObjectId,              // Referensi ke User
  meteranId: ObjectId,           // Referensi ke Meteran
  deviceId: String,              // MAC address atau unique ID device
  pairingCode: String,           // 6-digit temporary code
  pairingCodeExpiry: Date,       // Waktu expired (5 menit)
  status: Enum,                  // pending, connected, disconnected, error
  connectedAt: Date,             // Waktu koneksi berhasil
  lastSync: Date,                // Waktu sync terakhir dari device
  connectionMethod: Enum         // bluetooth, wifi
}
```

**User Model Updates**

```javascript
{
  iotConnectionId: ObjectId,     // Referensi ke IoTConnection
  isIoTConnected: Boolean        // Status koneksi aktif
}
```

#### 2. Controllers

**iotController.js** - 5 Main Functions:

1. **generatePairingCode** (User authenticated)

   - Generate 6-digit random code
   - Expires dalam 5 menit
   - Create/update pending IoTConnection record
   - Return: `{ pairingCode, expiresIn, expiresAt }`

2. **pairDevice** (Public endpoint - called by IoT device)

   - Validate pairing code & expiration
   - Update connection: deviceId, status="connected"
   - Update user: iotConnectionId, isIoTConnected=true
   - Return: `{ userId, meteranId, deviceId, connectedAt }`

3. **getConnectionStatus** (User authenticated)

   - Return current IoT connection details
   - Return: `{ isConnected, connection: {...} }`

4. **disconnectDevice** (User authenticated)

   - Set status="disconnected"
   - Set user.isIoTConnected=false
   - Return: `{ success, message }`

5. **iotHeartbeat** (Public endpoint - called by IoT device)
   - Update lastSync timestamp
   - Optional: update meteran reading
   - Return: `{ syncInterval: 60 }` (seconds for next heartbeat)

#### 3. Routes

**User Routes** (require authentication):

```javascript
POST / iot / generate - pairing - code; // Generate pairing code
GET / iot / connection - status; // Get connection status
POST / iot / disconnect; // Disconnect device
```

**Device Routes** (public):

```javascript
POST / iot / pair - device; // Pair device dengan code
POST / iot / heartbeat; // Device periodic sync
```

### Frontend Components

#### 1. IoT Connection Status Page

**Path:** `/profile/iot-connection`

**Features:**

- Display connection status (connected/disconnected)
- Show device info (deviceId, lastSync)
- Show meteran details
- Button to connect (if not connected)
- Button to disconnect (if connected)

#### 2. IoT Pairing Page

**Path:** `/profile/iot-connection/pair`

**Pairing Flow:**

1. **Idle State**: Show "Mulai Pairing" button
2. **Generating**: Call API to generate pairing code
3. **Waiting**: Display 6-digit code with countdown timer (5 min)
4. **Pairing**: Connect via Bluetooth, send code to device
5. **Success**: Show success message, redirect to status page
6. **Error**: Show error message with retry button

**Web Bluetooth Integration:**

```javascript
// Request Bluetooth device
const device = await navigator.bluetooth.requestDevice({
  filters: [
    { services: ["0000181a-0000-1000-8000-00805f9b34fb"] },
    { namePrefix: "AquaLink" },
  ],
});

// Connect to GATT server
const server = await device.gatt.connect();
const service = await server.getPrimaryService("...");
const characteristic = await service.getCharacteristic("...");

// Send pairing code
await characteristic.writeValue(encoder.encode(pairingCode));
```

## Workflow

### User-Initiated Pairing Flow

```
1. User clicks "Hubungkan Device IoT"
   ↓
2. Frontend: Navigate to /profile/iot-connection/pair
   ↓
3. User clicks "Generate Kode Pairing"
   ↓
4. Backend: Generate 6-digit code, save to DB (pending)
   ↓
5. Frontend: Display code with 5-minute countdown
   ↓
6. User clicks "Hubungkan Bluetooth"
   ↓
7. Browser: Show Bluetooth device picker
   ↓
8. User selects "AquaLink" device
   ↓
9. Frontend: Connect via GATT, send pairing code
   ↓
10. IoT Device: Receive code, call /iot/pair-device API
   ↓
11. Backend: Validate code, update status to "connected"
   ↓
12. Frontend: Poll connection status, show success
   ↓
13. Redirect to /profile/iot-connection (status page)
```

### Device Heartbeat Flow

```
Every 60 seconds:

1. IoT Device: Call /iot/heartbeat
   ↓
2. Backend: Update lastSync timestamp
   ↓
3. Backend: Optional - update meteran reading
   ↓
4. Backend: Return syncInterval for next heartbeat
```

## Security Features

1. **Temporary Pairing Codes**

   - 6-digit random codes
   - 5-minute expiration
   - One-time use only

2. **Server-Side Validation**

   - Validate code before pairing
   - Verify meteran assignment
   - Check code expiration

3. **User Authentication**

   - All user endpoints require JWT token
   - Device endpoints public (IoT calls directly)

4. **Connection Tracking**
   - Monitor device status
   - Track last sync time
   - Handle disconnections gracefully

## IoT Device Requirements

### 1. Bluetooth Capabilities

- Support Bluetooth Low Energy (BLE)
- Implement GATT server
- Use service UUID: `0000181a-0000-1000-8000-00805f9b34fb`
- Use characteristic UUID: `00002a59-0000-1000-8000-00805f9b34fb`

### 2. Device Implementation

**Pairing Process:**

```
1. Wait for characteristic write (pairing code)
2. Extract code from received data
3. Call backend API: POST /iot/pair-device
   Body: { pairingCode, deviceId }
4. Store userId and meteranId from response
5. Start heartbeat loop
```

**Heartbeat Process:**

```
setInterval(() => {
  POST /iot/heartbeat
  Body: {
    deviceId,
    meteranId,
    reading: currentReading (optional)
  }
}, 60000); // Every 60 seconds
```

### 3. Data to Store on Device

After successful pairing:

- `userId`: String
- `meteranId`: String
- `deviceId`: String (own MAC address)
- `serverUrl`: String (API endpoint)

## Testing Guide

### 1. Test Pairing Code Generation

```bash
# Login first to get token
curl -X POST http://localhost:5000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@test.com", "password": "password"}'

# Generate pairing code
curl -X POST http://localhost:5000/iot/generate-pairing-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"meteranId": "METERAN_ID"}'

# Expected Response:
# {
#   "status": 200,
#   "message": "Pairing code generated successfully",
#   "data": {
#     "pairingCode": "123456",
#     "expiresIn": 300,
#     "expiresAt": "2024-01-01T10:05:00.000Z"
#   }
# }
```

### 2. Test Device Pairing

```bash
# Simulate device pairing
curl -X POST http://localhost:5000/iot/pair-device \
  -H "Content-Type: application/json" \
  -d '{
    "pairingCode": "123456",
    "deviceId": "AA:BB:CC:DD:EE:FF"
  }'

# Expected Response:
# {
#   "status": 200,
#   "message": "Device paired successfully",
#   "data": {
#     "userId": "...",
#     "meteranId": "...",
#     "deviceId": "AA:BB:CC:DD:EE:FF",
#     "connectedAt": "..."
#   }
# }
```

### 3. Test Connection Status

```bash
# Check connection status
curl -X GET http://localhost:5000/iot/connection-status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
# {
#   "status": 200,
#   "message": "Connection status retrieved",
#   "data": {
#     "isConnected": true,
#     "connection": {
#       "deviceId": "AA:BB:CC:DD:EE:FF",
#       "status": "connected",
#       "lastSync": "...",
#       ...
#     }
#   }
# }
```

### 4. Test Heartbeat

```bash
# Simulate device heartbeat
curl -X POST http://localhost:5000/iot/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "AA:BB:CC:DD:EE:FF",
    "meteranId": "METERAN_ID",
    "reading": 125.5
  }'

# Expected Response:
# {
#   "status": 200,
#   "message": "Heartbeat received",
#   "data": {
#     "syncInterval": 60
#   }
# }
```

### 5. Test Disconnect

```bash
# Disconnect device
curl -X POST http://localhost:5000/iot/disconnect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
# {
#   "status": 200,
#   "message": "Device disconnected successfully"
# }
```

## Browser Compatibility

Web Bluetooth API is supported in:

- ✅ Chrome 56+ (Desktop & Android)
- ✅ Edge 79+
- ✅ Opera 43+
- ❌ Firefox (not supported)
- ❌ Safari (not supported)

**Recommendation:** Use Chrome or Edge browser for pairing.

## Error Handling

### Common Errors

1. **"Browser tidak mendukung Web Bluetooth API"**

   - Solution: Use Chrome or Edge

2. **"Kode pairing sudah kadaluarsa"**

   - Solution: Generate new code (codes expire after 5 minutes)

3. **"Invalid pairing code"**

   - Solution: Check code entered correctly, generate new if expired

4. **"Meteran not assigned to this user"**

   - Solution: Contact admin to assign meteran

5. **"Bluetooth connection failed"**
   - Solution: Check device is powered on and in range

## Database Indexes

For performance, ensure these indexes exist:

```javascript
// IoTConnection collection
db.iotconnections.createIndex({ userId: 1 });
db.iotconnections.createIndex({ meteranId: 1 });
db.iotconnections.createIndex({ deviceId: 1 });
db.iotconnections.createIndex({ pairingCode: 1 });

// User collection
db.users.createIndex({ iotConnectionId: 1 });
```

## Future Enhancements

1. **WiFi Connection Support**

   - Add WiFi as alternative to Bluetooth
   - Direct device-to-server communication

2. **Multiple Devices Per User**

   - Support multiple IoT devices
   - Device management interface

3. **Device Firmware Updates**

   - OTA (Over-The-Air) updates
   - Version management

4. **Advanced Monitoring**

   - Real-time alerts
   - Anomaly detection
   - Usage predictions

5. **Device Groups**
   - Group multiple devices
   - Bulk operations

## Troubleshooting

### Device Not Appearing in Bluetooth List

- Ensure device is powered on
- Check device is in pairing mode
- Verify device broadcasts correct service UUID
- Try restarting Bluetooth on device

### Pairing Code Not Working

- Check code hasn't expired (5 min limit)
- Verify user has meteran assigned
- Check backend logs for validation errors

### Connection Drops Frequently

- Check Bluetooth signal strength
- Verify device heartbeat is working
- Monitor lastSync timestamp
- Check device battery level

### Heartbeat Not Updating

- Verify device is sending heartbeat requests
- Check API endpoint is accessible from device
- Monitor backend logs for errors
- Verify deviceId matches registered device

## Support

For issues or questions:

1. Check backend console logs
2. Check browser console for frontend errors
3. Verify API endpoints are accessible
4. Test with curl commands above
5. Contact development team with error details
