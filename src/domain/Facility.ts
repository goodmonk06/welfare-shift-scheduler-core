/**
 * Facility（施設）エンティティ
 *
 * 複数の介護施設を管理するためのエンティティ
 */

/**
 * 施設タイプ
 */
export enum FacilityType {
  /** 特別養護老人ホーム */
  SPECIAL_NURSING_HOME = 'SPECIAL_NURSING_HOME',

  /** 介護老人保健施設 */
  HEALTH_SERVICE_FACILITY = 'HEALTH_SERVICE_FACILITY',

  /** グループホーム */
  GROUP_HOME = 'GROUP_HOME',

  /** デイサービス */
  DAY_SERVICE = 'DAY_SERVICE',

  /** 訪問介護 */
  HOME_CARE = 'HOME_CARE',

  /** サービス付き高齢者向け住宅 */
  SENIOR_HOUSING = 'SENIOR_HOUSING',
}

/**
 * 施設ステータス
 */
export enum FacilityStatus {
  /** 稼働中 */
  ACTIVE = 'ACTIVE',

  /** 準備中 */
  PREPARING = 'PREPARING',

  /** 一時休止 */
  SUSPENDED = 'SUSPENDED',

  /** 閉鎖 */
  CLOSED = 'CLOSED',
}

/**
 * 施設設定
 */
export interface FacilityConfiguration {
  /** 最小スタッフ数（日中） */
  minDaytimeStaff: number;

  /** 最小スタッフ数（夜間） */
  minNighttimeStaff: number;

  /** シフト作成開始日（毎月何日から翌月分を作成するか） */
  scheduleCreationDay: number;

  /** シフト確定日（毎月何日までに確定するか） */
  scheduleConfirmationDay: number;

  /** 希望休申請期限（何日前まで） */
  requestDeadlineDays: number;

  /** デフォルト連続勤務上限 */
  defaultMaxConsecutiveWorkDays: number;

  /** 夜勤間隔日数（夜勤と夜勤の間に必要な日数） */
  nightShiftIntervalDays: number;

  /** 自動承認を有効にするか */
  autoApproveShiftSwaps: boolean;

  /** 通知を有効にするか */
  notificationsEnabled: boolean;

  /** タイムゾーン */
  timezone: string;

  /** その他のメタデータ */
  metadata?: Record<string, any>;
}

/**
 * 施設の連絡先情報
 */
export interface FacilityContact {
  /** 電話番号 */
  phone: string;

  /** FAX番号 */
  fax?: string;

  /** メールアドレス */
  email: string;

  /** 緊急連絡先 */
  emergencyPhone?: string;

  /** 住所 */
  address: {
    postalCode: string;
    prefecture: string; // 都道府県
    city: string; // 市区町村
    addressLine1: string; // 番地
    addressLine2?: string; // 建物名・部屋番号
  };
}

/**
 * 施設
 */
export interface Facility {
  /** 施設ID */
  id: string;

  /** 施設名 */
  name: string;

  /** 施設タイプ */
  type: FacilityType;

  /** ステータス */
  status: FacilityStatus;

  /** 定員 */
  capacity: number;

  /** 施設長ID */
  managerId?: string;

  /** 連絡先情報 */
  contact: FacilityContact;

  /** 施設設定 */
  configuration: FacilityConfiguration;

  /** 開設日 */
  openedAt: Date;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;

  /** メモ */
  notes?: string;

  /** タグ */
  tags?: string[];
}

/**
 * 施設ユーティリティ
 */
export class FacilityUtil {
  /**
   * 施設が稼働中かどうか
   */
  static isActive(facility: Facility): boolean {
    return facility.status === FacilityStatus.ACTIVE;
  }

  /**
   * 施設の完全な住所を取得
   */
  static getFullAddress(facility: Facility): string {
    const { address } = facility.contact;
    return `〒${address.postalCode} ${address.prefecture}${address.city}${address.addressLine1}${address.addressLine2 || ''}`;
  }

  /**
   * シフト作成可能な期間かどうか
   */
  static canCreateSchedule(facility: Facility, targetYearMonth: string): boolean {
    if (!this.isActive(facility)) {
      return false;
    }

    const today = new Date();
    const currentDay = today.getDate();

    // シフト作成開始日以降かチェック
    return currentDay >= facility.configuration.scheduleCreationDay;
  }

  /**
   * 希望休申請可能な日付かどうか
   */
  static canRequestPreference(facility: Facility, targetDate: Date): boolean {
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= facility.configuration.requestDeadlineDays;
  }
}
