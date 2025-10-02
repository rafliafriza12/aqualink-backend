# Monitoring API Documentation

## Overview

API endpoint untuk mendapatkan statistik monitoring penggunaan air, termasuk rata-rata harian, perbandingan dengan bulan lalu, dan prediksi penggunaan.

---

## Endpoint

### GET /monitoring/stats/:userId/:meteranId

Mendapatkan statistik monitoring untuk meteran user tertentu.

**Authentication:** Required (Bearer Token)

**URL Parameters:**

- `userId` (string, required): ID user
- `meteranId` (string, required): ID meteran

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "status": "success",
  "data": {
    "currentMonth": {
      "totalUsage": 1250.5,
      "averageDailyUsage": 45.02,
      "daysElapsed": 15,
      "daysInMonth": 31
    },
    "lastMonth": {
      "totalUsage": 1800.75
    },
    "comparison": {
      "percentage": 30.5,
      "status": "turun",
      "message": "Hemat 31% dari bulan lalu"
    },
    "prediction": {
      "remainingDays": 16,
      "predictedUsage": 720.32,
      "totalProjected": 1970.82
    },
    "meteran": {
      "totalPemakaian": 5432.1,
      "pemakaianBelumTerbayar": 1250.5
    }
  }
}
```

**Response Fields:**

- `currentMonth`: Data penggunaan bulan berjalan

  - `totalUsage`: Total penggunaan di bulan ini (Liter)
  - `averageDailyUsage`: Rata-rata penggunaan per hari (Liter/hari)
  - `daysElapsed`: Jumlah hari yang sudah berlalu di bulan ini
  - `daysInMonth`: Total hari dalam bulan ini

- `lastMonth`: Data penggunaan bulan lalu

  - `totalUsage`: Total penggunaan bulan lalu (Liter)

- `comparison`: Perbandingan dengan bulan lalu

  - `percentage`: Persentase perubahan
  - `status`: Status perubahan ("naik", "turun", atau "sama")
  - `message`: Pesan deskriptif

- `prediction`: Prediksi penggunaan

  - `remainingDays`: Sisa hari di bulan ini
  - `predictedUsage`: Prediksi penggunaan untuk sisa hari (Liter)
  - `totalProjected`: Total proyeksi akhir bulan (Liter)

- `meteran`: Data meteran
  - `totalPemakaian`: Total akumulasi pemakaian (Liter)
  - `pemakaianBelumTerbayar`: Pemakaian yang belum dibayar (Liter)

**Response Error (404):**

```json
{
  "status": "error",
  "message": "Meteran not found"
}
```

**Response Error (500):**

```json
{
  "status": "error",
  "message": "Failed to get monitoring statistics",
  "error": "Error detail message"
}
```

---

## Frontend Integration

### Service Layer

**File:** `app/services/monitoring/monitoring.service.ts`

```typescript
import API from "@/app/utils/API";
import { MonitoringStatsResponse } from "./monitoring.type";

export const getMonitoringStats = async (
  userId: string,
  meteranId: string,
  token: string
): Promise<MonitoringStatsResponse> => {
  const response = await API.get(`/monitoring/stats/${userId}/${meteranId}`, {
    headers: {
      Authorization: token,
    },
  });
  return response.data;
};
```

**File:** `app/services/monitoring/monitoring.type.ts`

```typescript
export interface MonitoringStats {
  currentMonth: {
    totalUsage: number;
    averageDailyUsage: number;
    daysElapsed: number;
    daysInMonth: number;
  };
  lastMonth: {
    totalUsage: number;
  };
  comparison: {
    percentage: number;
    status: "naik" | "turun" | "sama";
    message: string;
  };
  prediction: {
    remainingDays: number;
    predictedUsage: number;
    totalProjected: number;
  };
  meteran: {
    totalPemakaian: number;
    pemakaianBelumTerbayar: number;
  };
}

export interface MonitoringStatsResponse {
  status: string;
  data: MonitoringStats;
}
```

**File:** `app/services/monitoring/monitoring.mutation.ts`

```typescript
import { useMutation } from "@tanstack/react-query";
import { getMonitoringStats } from "./monitoring.service";

export const useGetMonitoringStats = () => {
  return useMutation({
    mutationFn: ({
      userId,
      meteranId,
      token,
    }: {
      userId: string;
      meteranId: string;
      token: string;
    }) => getMonitoringStats(userId, meteranId, token),
  });
};
```

### Usage in Component

```typescript
import { useGetMonitoringStats } from "@/app/services/monitoring/monitoring.mutation";
import { MonitoringStats } from "@/app/services/monitoring/monitoring.type";

const Monitoring: React.FC = () => {
  const auth = useAuth();
  const monitoringStatsMutation = useGetMonitoringStats();
  const [monitoringStats, setMonitoringStats] =
    useState<MonitoringStats | null>(null);

  const fetchStats = async () => {
    const result = await monitoringStatsMutation.mutateAsync({
      userId: user._id,
      meteranId: user.meteranId._id,
      token: auth.auth.token || "",
    });

    if (result?.data) {
      setMonitoringStats(result.data);
    }
  };

  // Display data
  return (
    <div>
      <h1>
        Rata-rata: {monitoringStats?.currentMonth?.averageDailyUsage} L/hari
      </h1>
      <h1>Status: {monitoringStats?.comparison?.message}</h1>
    </div>
  );
};
```

---

## Use Cases

### 1. Dashboard Monitoring

Menampilkan statistik penggunaan air real-time dengan perbandingan bulan lalu:

- ✅ Rata-rata penggunaan harian
- ✅ Evaluasi penghematan (naik/turun dari bulan lalu)
- ✅ Prediksi penggunaan akhir bulan

### 2. Analisis Penggunaan

Memberikan insight untuk user tentang pola penggunaan air mereka:

- ✅ Perbandingan dengan periode sebelumnya
- ✅ Proyeksi biaya berdasarkan prediksi
- ✅ Rekomendasi penghematan

### 3. Alert System

Trigger notifikasi jika:

- ❗ Penggunaan naik signifikan (> 50%)
- ✅ Berhasil hemat (turun > 20%)
- ⚠️ Prediksi melebihi budget

---

## Calculation Logic

### Average Daily Usage

```
averageDailyUsage = currentMonthTotal / daysElapsed
```

### Comparison Percentage

```
comparisonPercentage = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
```

### Predicted Usage

```
predictedUsage = averageDailyUsage * remainingDays
totalProjected = currentMonthTotal + predictedUsage
```

---

## Testing

### cURL Example

```bash
curl -X GET \
  http://localhost:5000/api/monitoring/stats/USER_ID/METERAN_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Expected Response

```json
{
  "status": "success",
  "data": {
    "currentMonth": {
      "totalUsage": 450.25,
      "averageDailyUsage": 45.03,
      "daysElapsed": 10,
      "daysInMonth": 31
    },
    "lastMonth": {
      "totalUsage": 800.5
    },
    "comparison": {
      "percentage": 43.7,
      "status": "turun",
      "message": "Hemat 44% dari bulan lalu"
    },
    "prediction": {
      "remainingDays": 21,
      "predictedUsage": 945.63,
      "totalProjected": 1395.88
    },
    "meteran": {
      "totalPemakaian": 3250.75,
      "pemakaianBelumTerbayar": 450.25
    }
  }
}
```

---

## Notes

1. **Data Accuracy**: Statistik dihitung berdasarkan data `HistoryUsage` yang tersimpan di database
2. **Time Range**: Menggunakan timezone server untuk menentukan awal/akhir bulan
3. **First Month Handling**: Jika tidak ada data bulan lalu, comparison akan menunjukkan status "sama"
4. **Zero Usage**: Jika tidak ada penggunaan sama sekali, rata-rata akan menunjukkan 0

---

## Related Endpoints

- `GET /users/profile` - Get user profile dengan meteranId
- `GET /history/getHistory/:userId/:meteranId?filter=bulan` - Get history usage untuk perhitungan
- `GET /billing/my-billing` - Get billing information untuk proyeksi biaya
