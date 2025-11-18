/**
 * 職種・役割
 */
export enum Role {
  /** 介護福祉士 */
  CARE_WORKER = 'CARE_WORKER',

  /** 看護師 */
  NURSE = 'NURSE',

  /** ケアマネージャー */
  CARE_MANAGER = 'CARE_MANAGER',

  /** 介護助手 */
  CARE_ASSISTANT = 'CARE_ASSISTANT',

  /** 理学療法士 */
  PHYSICAL_THERAPIST = 'PHYSICAL_THERAPIST',

  /** 作業療法士 */
  OCCUPATIONAL_THERAPIST = 'OCCUPATIONAL_THERAPIST',

  /** 栄養士 */
  DIETITIAN = 'DIETITIAN',

  /** 施設長 */
  FACILITY_MANAGER = 'FACILITY_MANAGER',
}

/**
 * 役割の日本語名を取得
 */
export const ROLE_NAMES: Record<Role, string> = {
  [Role.CARE_WORKER]: '介護福祉士',
  [Role.NURSE]: '看護師',
  [Role.CARE_MANAGER]: 'ケアマネージャー',
  [Role.CARE_ASSISTANT]: '介護助手',
  [Role.PHYSICAL_THERAPIST]: '理学療法士',
  [Role.OCCUPATIONAL_THERAPIST]: '作業療法士',
  [Role.DIETITIAN]: '栄養士',
  [Role.FACILITY_MANAGER]: '施設長',
};

/**
 * スキル（複数の役割で共通する能力）
 */
export enum Skill {
  /** 介護技術 */
  CARE_SKILLS = 'CARE_SKILLS',

  /** 医療処置 */
  MEDICAL_TREATMENT = 'MEDICAL_TREATMENT',

  /** リーダーシップ */
  LEADERSHIP = 'LEADERSHIP',

  /** 認知症ケア */
  DEMENTIA_CARE = 'DEMENTIA_CARE',

  /** 機能訓練 */
  REHABILITATION = 'REHABILITATION',

  /** 食事介助 */
  MEAL_ASSISTANCE = 'MEAL_ASSISTANCE',

  /** 入浴介助 */
  BATHING_ASSISTANCE = 'BATHING_ASSISTANCE',

  /** 夜勤可能 */
  NIGHT_SHIFT_CAPABLE = 'NIGHT_SHIFT_CAPABLE',
}
