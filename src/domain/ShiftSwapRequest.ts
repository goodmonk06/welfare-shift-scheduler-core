/**
 * ShiftSwapRequest（シフト交換リクエスト）エンティティ
 *
 * 従業員間のシフト交換・トレード機能
 */

/**
 * シフト交換リクエストのステータス
 */
export enum ShiftSwapStatus {
  /** 申請中 */
  PENDING = 'PENDING',

  /** 承認待ち（相手が承諾済み） */
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',

  /** 承認済み */
  APPROVED = 'APPROVED',

  /** 拒否 */
  REJECTED = 'REJECTED',

  /** キャンセル */
  CANCELLED = 'CANCELLED',

  /** 期限切れ */
  EXPIRED = 'EXPIRED',
}

/**
 * シフト交換タイプ
 */
export enum ShiftSwapType {
  /** 直接交換（AとBのシフトを入れ替え） */
  DIRECT_SWAP = 'DIRECT_SWAP',

  /** シフト譲渡（Aが Bにシフトを譲る） */
  TRANSFER = 'TRANSFER',

  /** 代理勤務（Aの代わりにBが勤務） */
  SUBSTITUTE = 'SUBSTITUTE',
}

/**
 * シフト交換リクエスト
 */
export interface ShiftSwapRequest {
  /** リクエストID */
  id: string;

  /** 施設ID */
  facilityId: string;

  /** スケジュールID（年月） */
  scheduleId: string;

  /** 交換タイプ */
  type: ShiftSwapType;

  /** ステータス */
  status: ShiftSwapStatus;

  /** 申請者ID */
  requesterId: string;

  /** 申請者のシフト情報 */
  requesterShift: {
    date: string;
    shiftTypeId: string;
  };

  /** 相手ID */
  targetEmployeeId: string;

  /** 相手のシフト情報 */
  targetShift?: {
    date: string;
    shiftTypeId: string;
  };

  /** 申請理由 */
  reason?: string;

  /** メッセージ */
  message?: string;

  /** 相手の承諾日時 */
  targetAcceptedAt?: Date;

  /** 承認者ID */
  approverId?: string;

  /** 承認日時 */
  approvedAt?: Date;

  /** 拒否理由 */
  rejectionReason?: string;

  /** 有効期限 */
  expiresAt: Date;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;

  /** メタデータ */
  metadata?: Record<string, any>;
}

/**
 * シフト交換履歴
 */
export interface ShiftSwapHistory {
  /** 履歴ID */
  id: string;

  /** リクエストID */
  swapRequestId: string;

  /** アクション */
  action: 'CREATED' | 'ACCEPTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

  /** アクション実行者ID */
  actorId: string;

  /** アクション実行者の役割 */
  actorRole: 'REQUESTER' | 'TARGET' | 'MANAGER' | 'ADMIN';

  /** コメント */
  comment?: string;

  /** タイムスタンプ */
  timestamp: Date;
}

/**
 * シフト交換リクエストユーティリティ
 */
export class ShiftSwapRequestUtil {
  /**
   * リクエストが承認可能かどうか
   */
  static canApprove(request: ShiftSwapRequest): boolean {
    return (
      request.status === ShiftSwapStatus.AWAITING_APPROVAL &&
      !this.isExpired(request)
    );
  }

  /**
   * リクエストが期限切れかどうか
   */
  static isExpired(request: ShiftSwapRequest): boolean {
    return new Date() > request.expiresAt;
  }

  /**
   * リクエストが最終状態かどうか
   */
  static isFinal(request: ShiftSwapRequest): boolean {
    return [
      ShiftSwapStatus.APPROVED,
      ShiftSwapStatus.REJECTED,
      ShiftSwapStatus.CANCELLED,
      ShiftSwapStatus.EXPIRED,
    ].includes(request.status);
  }

  /**
   * リクエストをキャンセル可能かどうか
   */
  static canCancel(request: ShiftSwapRequest, employeeId: string): boolean {
    return (
      request.requesterId === employeeId &&
      !this.isFinal(request)
    );
  }

  /**
   * 相手が承諾可能かどうか
   */
  static canAccept(request: ShiftSwapRequest, employeeId: string): boolean {
    return (
      request.targetEmployeeId === employeeId &&
      request.status === ShiftSwapStatus.PENDING &&
      !this.isExpired(request)
    );
  }

  /**
   * デフォルトの有効期限を計算（7日後）
   */
  static calculateDefaultExpiry(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    return expiry;
  }

  /**
   * ステータスの日本語名を取得
   */
  static getStatusName(status: ShiftSwapStatus): string {
    const names: Record<ShiftSwapStatus, string> = {
      [ShiftSwapStatus.PENDING]: '申請中',
      [ShiftSwapStatus.AWAITING_APPROVAL]: '承認待ち',
      [ShiftSwapStatus.APPROVED]: '承認済み',
      [ShiftSwapStatus.REJECTED]: '拒否',
      [ShiftSwapStatus.CANCELLED]: 'キャンセル',
      [ShiftSwapStatus.EXPIRED]: '期限切れ',
    };
    return names[status];
  }

  /**
   * タイプの日本語名を取得
   */
  static getTypeName(type: ShiftSwapType): string {
    const names: Record<ShiftSwapType, string> = {
      [ShiftSwapType.DIRECT_SWAP]: '直接交換',
      [ShiftSwapType.TRANSFER]: 'シフト譲渡',
      [ShiftSwapType.SUBSTITUTE]: '代理勤務',
    };
    return names[type];
  }
}
