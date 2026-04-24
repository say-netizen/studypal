export const GRADES = [
  { value: "小学3年生", label: "小3", stage: "小学生" as const },
  { value: "小学4年生", label: "小4", stage: "小学生" as const },
  { value: "小学5年生", label: "小5", stage: "小学生" as const },
  { value: "小学6年生", label: "小6", stage: "小学生" as const },
  { value: "中学1年生", label: "中1", stage: "中学生" as const },
  { value: "中学2年生", label: "中2", stage: "中学生" as const },
  { value: "中学3年生", label: "中3", stage: "中学生" as const },
  { value: "高校1年生", label: "高1", stage: "高校生" as const },
  { value: "高校2年生", label: "高2", stage: "高校生" as const },
  { value: "高校3年生", label: "高3", stage: "高校生" as const },
] as const;

export type GradeStage = "小学生" | "中学生" | "高校生";
export const GRADE_STAGES: GradeStage[] = ["小学生", "中学生", "高校生"];
