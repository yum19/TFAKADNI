// ===== PREGNANCY =====
export interface Pregnancy {
    id: number;
    user: any;
    lmpDate: string;
    dueDate: string;
    status: 'ACTIVE' | 'COMPLETED' | 'MISCARRIAGE' | 'TERMINATED';
    pregnancyType: 'SINGLETON' | 'TWINS' | 'TRIPLETS';
    hospitalName: string;
    doctorName: string;
    notes: string;
    isSharedPartner: boolean;
    createdAt: string;
}

// ===== VITALS =====
export interface Vitals {
    id: number;
    user: any;
    pregnancy: any;
    measuredAt: string;
    systolicBp: number;
    diastolicBp: number;
    weightKg: number;
    heartRate: number;
    glucoseMmol: number;
    temperatureC: number;
    oxygenPct: number;
    notes: string;
    isSharedDoctor: boolean;
    source: 'MANUAL' | 'DEVICE' | 'IMPORT';
     mlRiskLevel?: string;        // ← ADD THIS
    mlRiskScore?: number;
}

// ===== ALERT =====
export interface Alert {
    id: number;
    user: any;
    vital: any;
    alertType: 'HYPERTENSION' | 'HYPOGLYCEMIA' | 'WEIGHT' | 'TACHYCARDIA' | 'FEVER' | 'OXYGEN' | 'CUSTOM';
    severity: 'INFO' | 'WARNING' | 'DANGER' | 'CRITICAL';
    message: string;
    recommendation: string;
    triggeredAt: string;
    isRead: boolean;
    dismissedAt: string;
    notifSent: boolean;
}

// ===== ALERT RULE =====
export interface AlertRule {
    id: number;
    user: any;
    metric: 'SYSTOLIC_BP' | 'DIASTOLIC_BP' | 'WEIGHT_KG' | 'HEART_RATE' | 'GLUCOSE_MMOL' | 'TEMPERATURE_C' | 'OXYGEN_PCT';
    operator: 'GT' | 'LT' | 'GTE' | 'LTE' | 'EQ';
    threshold: number;
    severity: 'INFO' | 'WARNING' | 'DANGER' | 'CRITICAL';
    notifMethod: string;
    active: boolean;
    label: string;
    createdAt: string;
}

// ===== FETAL MILESTONE =====
export interface FetalMilestone {
    id: number;
    weekNumber: number;
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
    sizeCm: number;
    weightG: number;
    sizeComparison: string;
    imageUrl: string;
    trimester: 'T1' | 'T2' | 'T3';
    motherSymptoms: string;
    medicalAdvice: string;
}

// ===== PRENATAL EXAM =====
export interface PrenatalExam {
    id: number;
    pregnancy: any;
    examName: string;
    examType: 'MANDATORY' | 'OPTIONAL' | 'CUSTOM';
    recommendedWeek: number;
    done: boolean;
    doneDate: string;
    resultNotes: string;
    documentUrl: string;
    reminderSent: boolean;
    createdAt: string;
    vital?: any;       
    alertSeverity?: string; 
}

export interface User {
    id: number;
    email: string;
    name: string;
}