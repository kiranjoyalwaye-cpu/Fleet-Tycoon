// ============================================================================
// Secure API Client for Backend Services (Leaderboards, OTA Updates, Privacy Reports)
// Zero Client-Side Secrets - All Auth and Signing Handled Via Verified Endpoints
// ============================================================================

export interface OtaManifestResponse {
  success: boolean;
  manifest: {
    version: string;
    buildNumber: number;
    releaseDate: string;
    channel: string;
    checksum: string;
    signature: string;
    encryption: string;
    mandatory: boolean;
    notes: string[];
    payload: {
      engineTweaks: Record<string, number>;
      configOverrides: Record<string, any>;
    };
  };
}

export interface LeaderboardItem {
  id: string;
  anonymousCallsign: string;
  score: number;
  rating: string;
  cash: number;
  nps: number;
  sharePct: number;
  days: number;
  difficulty: string;
  timestamp: string;
  encryptedHash: string;
}

export interface MonthlyReportData {
  reportId: string;
  period: string;
  generatedAt: string;
  privacyStandard: string;
  zeroKnowledgeProof: string;
  anonymizedMetrics: {
    totalShiftsRecorded: number;
    totalOrdersDispatched: number;
    grossMerchandiseVolume: number;
    netOperatingSurplus: number;
    privacyProtectedNps: number;
    privacyProtectedMarketShare: number;
    deliveryReliabilityRate: string;
    carbonOffsetScore: string;
  };
  privacyGuarantees: string[];
}

export const api = {
  // Check health and security status
  async checkHealth() {
    try {
      const res = await fetch('/api/health');
      return await res.json();
    } catch {
      return { status: 'offline', security: { obfuscatedBundle: true } };
    }
  },

  // Fetch current OTA Patch Manifest
  async getOtaManifest(): Promise<OtaManifestResponse | null> {
    try {
      const res = await fetch('/api/patch/manifest');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // Download encrypted OTA payload
  async downloadPatch(version?: string) {
    try {
      const url = version ? `/api/patch/download?version=${encodeURIComponent(version)}` : '/api/patch/download';
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // Deploy / Simulate an OTA patch release from the secure backend
  async publishOtaPatch(newVersion: string, notes: string[], tweaks?: Record<string, number>) {
    try {
      const res = await fetch('/api/patch/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newVersion, notes, engineTweaks: tweaks })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // Fetch Leaderboard rankings
  async getLeaderboard(params?: { days?: number; difficulty?: string }): Promise<LeaderboardItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.days) query.set('days', String(params.days));
      if (params?.difficulty) query.set('difficulty', params.difficulty);

      const res = await fetch(`/api/leaderboard?${query.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.leaderboard || [];
    } catch {
      return [];
    }
  },

  // Submit high score to global rankings (anonymously, zero PII)
  async submitScore(entry: {
    anonymousCallsign: string;
    score: number;
    rating: string;
    cash: number;
    nps: number;
    sharePct: number;
    days: number;
    difficulty: string;
  }) {
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // Generate verified privacy-first monthly summary
  async generateMonthlyReport(summary: {
    month?: string;
    year?: number;
    totalShifts: number;
    ordersServed: number;
    gmv: number;
    netProfit: number;
    avgNps: number;
    avgSharePct: number;
    privacyNoise?: boolean;
  }): Promise<{ success: boolean; report?: MonthlyReportData; error?: string }> {
    try {
      const res = await fetch('/api/reports/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summary)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
};
