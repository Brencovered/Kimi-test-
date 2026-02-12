"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Zap,
  Clock,
  Target,
  BarChart3,
  Sparkles,
  Activity,
  Layers,
  Cpu,
  Shield,
  ArrowRight,
  Download,
  FileText,
  Database,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** ================== Types ================== */
type Tab = "ceo" | "drilldown" | "ai-scale" | "ops" | "ai-budget";
type Mode = "conservative" | "downstream";

type Modules = { planInspect: boolean; dataManage: boolean; processReport: boolean };

type CustomerInputs = {
  orgName: string;
  customers: number;
  annualSAIDI_min_perCustomer: number;
  annualUnplannedOutages: number;
  annualEmergencyCallouts: number;
  annualFaultCalls: number;
  annualComplaints: number;
  annualGSLPayments: number;
  stpisExposure: number;
  annualInspections: number;
  revisitRatePct: number;
  imagesPerInspection: number;
  costPerRevisit: number;
  costPerEmergencyCallout: number;
  platformProcessingHoursPerWeek: number;
  platformProcessingRatePerHour: number;
  pctImagesManualClassified: number;
  minsPerImageManualClassify: number;
  triageRatePerHour: number;
};

type UlInputs = {
  weeks: number;
  seed: number;
  playbackSpeedMs: number;
  stepChangePct: number;
  modules: Modules;
  classesRequired: number;
  classesLive: number;
  maxPlatformProcessingReductionPctAt10: number;
  maxManualTriageReductionPctAt10: number;
  maxRevisitReductionPctAt10: number;
  maxEmergencyReductionPctAt10: number;
  maxOutageReductionPctAt10: number;
  valuePerCustomerMinuteSAIDI: number;
};

type AiBudgetInputs = {
  budget5y: number;
  incrementalBuildShareLowPct: number;
  incrementalBuildShareHighPct: number;
  avoidedBuildLowPct: number;
  avoidedBuildHighPct: number;
};

type AiScaleInputs = {
  currentWeakClasses: number;
  currentMediumClasses: number;
  currentStrongClasses: number;
  targetStrongClasses: number;
  deliveryHoursPerWeek: number;
  labelsPerHour: number;
  qaOverheadPct: number;
  labelsPerClassPerIteration: number;
  iterationsNewToStrong: number;
  extraIterationsWeakToStrong: number;
  extraIterationsMediumToStrong: number;
  currentContextSwitchOverheadPct: number;
  currentParallelismLimit: number;
  ulOnboardingWeeks: number;
  ulStarterStrongClasses: number;
  ulTransferLabelReductionPct: number;
  ulIterationReduction: number;
  ulParallelism: number;
};

type ProgramInputs = {
  horizonWeeks: number;
  patrolInspectors: number;
  dronePilots: number;
  patrolPolesPerInspectorPerDay: number;
  dronePolesPerPilotPerDay: number;
  droneInspectionMode: "manual" | "automated";
  patrolSharePct: number;
  droneSharePct: number;
  imagesPerPole: number;
  workingDaysPerWeek: number;
  fieldToCloudHours: number;
  assetAssignmentHours: number;
  aiOverlayHours: number;
  manualAssessMinsPerImage: number;
  annotationMinsPerImage: number;
  percentImagesNeedingAnnotationPct: number;
  assessReviewers: number;
  reviewerHoursPerDay: number;
  decisionsPerPole: number;
  startingBacklogImages: number;
};

type ProgramUlLevers = {
  capabilityMultiplier: 2 | 3 | 4 | 5;
  enablePlanInspectBoost: boolean;
  enableDataManageBoost: boolean;
  enableProcessReportBoost: boolean;
  captureProductivityBoostPctPerX: number;
  fieldToCloudReductionPctPerX: number;
  assignmentReductionPctPerX: number;
  aiOverlayReductionPctPerX: number;
  manualAssessReductionPctPerX: number;
  annotationSpeedBoostPctPerX: number;
  percentImagesNeedingAnnotationReductionPctPerX: number;
  post3MonthBoostPct: number;
  modelMaturityAccelerationPct: number;
};

type ProgramWeek = {
  week: number;
  polesCaptured_current: number;
  polesCaptured_ul: number;
  imagesArriving_current: number;
  imagesArriving_ul: number;
  imagesProcessed_current: number;
  imagesProcessed_ul: number;
  backlogImages_current: number;
  backlogImages_ul: number;
  timeToAssessWeeks_current: number;
  timeToAssessWeeks_ul: number;
  decisions_current: number;
  decisions_ul: number;
  latencyHours_current: number;
  latencyHours_ul: number;
  annotationShare_current: number;
  annotationShare_ul: number;
  assessMins_current: number;
  assessMins_ul: number;
};

type ProgramSummary = {
  current: { totalPoles: number; totalImages: number; totalProcessed: number; endingBacklog: number; avgTimeToAssessWeeks: number; p90TimeToAssessWeeks: number; avgLatencyHours: number; decisions: number };
  ul: { totalPoles: number; totalImages: number; totalProcessed: number; endingBacklog: number; avgTimeToAssessWeeks: number; p90TimeToAssessWeeks: number; avgLatencyHours: number; decisions: number };
  deltas: { backlogReduced: number; timeToAssessWeeksReduced: number; latencyHoursReduced: number; decisionsDelta: number; throughputDeltaImages: number };
};

type ModelTier = "base" | "mod" | "robust";
type ModelTargetInputs = { currentTier: ModelTier; targetTier: ModelTier; targetByWeek: number };
type ModelTierParams = { manualAssessMinsMultiplier: number; annotationMinsMultiplier: number; annotationShareMultiplier: number; aiOverlayHoursMultiplier: number };

const MODEL_PARAMS: Record<ModelTier, ModelTierParams> = {
  base: { manualAssessMinsMultiplier: 1, annotationMinsMultiplier: 1, annotationShareMultiplier: 1, aiOverlayHoursMultiplier: 1 },
  mod: { manualAssessMinsMultiplier: 0.78, annotationMinsMultiplier: 0.8, annotationShareMultiplier: 0.7, aiOverlayHoursMultiplier: 0.9 },
  robust: { manualAssessMinsMultiplier: 0.55, annotationMinsMultiplier: 0.6, annotationShareMultiplier: 0.45, aiOverlayHoursMultiplier: 0.85 },
};

type AssetComponent = "dist_crossarm" | "dist_insulators" | "dist_pole_top" | "dist_transformer" | "dist_cutout_fuse" | "dist_service_mains" | "dist_stay_wire" | "dist_guy_anchor" | "tx_tower_structure" | "tx_insulators" | "tx_hardware" | "tx_dampers_spacers" | "tx_earthing_bonding" | "cond_conductor" | "cond_joints_splices" | "cond_clamps_connectors" | "cond_vegetation_clearance";

type AssetTargetingInputs = { selected: Record<AssetComponent, boolean>; imagesPerComponentLow: number; imagesPerComponentHigh: number; ulCostPerImage: number; engineersAllocatedCurrent: number; engineersAllocatedUl: number };

const COMPONENT_LABELS: Record<AssetComponent, string> = {
  dist_crossarm: "Distribution — Crossarm", dist_insulators: "Distribution — Insulators", dist_pole_top: "Distribution — Pole-top hardware", dist_transformer: "Distribution — Pole-mounted transformer", dist_cutout_fuse: "Distribution — Cut-out / fuse", dist_service_mains: "Distribution — Service mains", dist_stay_wire: "Distribution — Stay wire", dist_guy_anchor: "Distribution — Guy / anchor", tx_tower_structure: "Transmission — Tower structure", tx_insulators: "Transmission — Insulators (strings)", tx_hardware: "Transmission — Hardware fittings", tx_dampers_spacers: "Transmission — Dampers / spacers", tx_earthing_bonding: "Transmission — Earthing / bonding", cond_conductor: "Conductor — Conductor condition", cond_joints_splices: "Conductor — Joints / splices", cond_clamps_connectors: "Conductor — Clamps / connectors", cond_vegetation_clearance: "Conductor — Vegetation clearance",
};

const COMPONENT_GROUPS: Array<{ title: string; keys: AssetComponent[] }> = [
  { title: "Distribution", keys: ["dist_crossarm", "dist_insulators", "dist_pole_top", "dist_transformer", "dist_cutout_fuse", "dist_service_mains", "dist_stay_wire", "dist_guy_anchor"] },
  { title: "Transmission", keys: ["tx_tower_structure", "tx_insulators", "tx_hardware", "tx_dampers_spacers", "tx_earthing_bonding"] },
  { title: "Conductor", keys: ["cond_conductor", "cond_joints_splices", "cond_clamps_connectors", "cond_vegetation_clearance"] },
];

/** ================== Helpers ================== */
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function pct(p: number) { return p / 100; }
function fmtNum(n: number, digits = 0) { return n.toLocaleString(undefined, { maximumFractionDigits: digits }); }
function fmtMoney(n: number) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}
function round(n: number, digits = 0) { const m = Math.pow(10, digits); return Math.round(n * m) / m; }
function safeSlug(name: string) { return (name || "customer").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function makeRng(seed: number) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
function ramp01(x: number) { return clamp(x, 0, 1); }
function smoothstep(t: number) { const x = ramp01(t); return x * x * (3 - 2 * x); }
function month3Gate(week: number) { return smoothstep((week - 1) / 11); }
function moduleTiming(week: number) { const w = week; return { planInspect: smoothstep((w - 1) / 7), dataManage: smoothstep((w - 1) / 15), processReport: smoothstep((w - 4) / 22), post3m: month3Gate(w) }; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * clamp(t, 0, 1); }
function lerpTierParams(a: ModelTierParams, b: ModelTierParams, t: number): ModelTierParams { return { manualAssessMinsMultiplier: lerp(a.manualAssessMinsMultiplier, b.manualAssessMinsMultiplier, t), annotationMinsMultiplier: lerp(a.annotationMinsMultiplier, b.annotationMinsMultiplier, t), annotationShareMultiplier: lerp(a.annotationShareMultiplier, b.annotationShareMultiplier, t), aiOverlayHoursMultiplier: lerp(a.aiOverlayHoursMultiplier, b.aiOverlayHoursMultiplier, t) }; }
function maturityAtWeek(week: number, targets: ModelTargetInputs): ModelTierParams { const from = MODEL_PARAMS[targets.currentTier]; const to = MODEL_PARAMS[targets.targetTier]; const t = targets.targetByWeek <= 1 ? 1 : clamp((week - 1) / (targets.targetByWeek - 1), 0, 1); return lerpTierParams(from, to, smoothstep(t)); }
function countSelected(selected: Record<AssetComponent, boolean>) { return Object.values(selected).reduce((a, v) => a + (v ? 1 : 0), 0); }

/** ================== OPS SIM ================== */
type WeekRow = { week: number; isMajorEvent: boolean; severity: number; curRevisits: number; ulRevisits: number; curEmergency: number; ulEmergency: number; curOutages: number; ulOutages: number; curSAIDI_customerMinutes: number; ulSAIDI_customerMinutes: number; curPlatformProcHours: number; ulPlatformProcHours: number; curManualTriageHours: number; ulManualTriageHours: number; ulCapacityGainInspections: number; bf_field: number; bf_data: number; bf_ai: number; bf_post3m: number };
type SavingsBreakdown = { revisitsAvoided: number; emergencyAvoided: number; outagesAvoided: number; saidiCustomerMinutesAvoided: number; platformProcHoursSaved: number; manualTriageHoursSaved: number; revisitSavings: number; emergencySavings: number; platformProcSavings: number; triageSavings: number; reliabilityValue: number; total: number; capacityGainInspections: number };

function buildWeeks(cust: CustomerInputs, ul: UlInputs) {
  const rng = makeRng(ul.seed);
  const W = ul.weeks;
  const majorWeeksPerYear = 6;
  const majorMultiplier = 1.8;
  const normalMin = 0.85;
  const normalMax = 1.25;
  const majorWeeks = new Set<number>();
  while (majorWeeks.size < clamp(majorWeeksPerYear, 0, W)) majorWeeks.add(1 + Math.floor(rng() * W));
  const baseInspections = cust.annualInspections / W;
  const baseRevisits = baseInspections * pct(cust.revisitRatePct);
  const baseEmergency = cust.annualEmergencyCallouts / W;
  const baseOutages = cust.annualUnplannedOutages / W;
  const annualSAIDI_customerMinutes = cust.annualSAIDI_min_perCustomer * cust.customers;
  const baseSAIDI_customerMinutes = annualSAIDI_customerMinutes / W;
  const baseWeeklyImages = baseInspections * cust.imagesPerInspection;
  const baseManualTriageHours = (baseWeeklyImages * pct(cust.pctImagesManualClassified) * cust.minsPerImageManualClassify) / 60;
  const basePlatformProcHours = cust.platformProcessingHoursPerWeek;
  const step = clamp(ul.stepChangePct, 1, 10) / 10;
  const classesRequired = Math.max(1, ul.classesRequired);
  const coverageFactor = clamp(ul.classesLive / classesRequired, 0, 1);
  const mods = ul.modules;
  const rows: WeekRow[] = Array.from({ length: W }, (_, i) => {
    const week = i + 1;
    const isMajorEvent = majorWeeks.has(week);
    const normalSeverity = normalMin + rng() * (normalMax - normalMin);
    const severity = isMajorEvent ? 1 + rng() * (majorMultiplier - 1) : normalSeverity;
    const t = moduleTiming(week);
    const bf_field = mods.planInspect ? t.planInspect : 0;
    const bf_data = mods.dataManage ? t.dataManage : 0;
    const bf_ai = mods.processReport ? t.processReport : 0;
    const bf_post3m = t.post3m;
    const adoptField = clamp(0.7 * bf_field + 0.3 * bf_data, 0, 1);
    const adoptData = clamp(0.2 * bf_field + 0.8 * bf_data, 0, 1);
    const adoptAI = clamp(bf_ai, 0, 1);
    const platformProcImpact = step * pct(ul.maxPlatformProcessingReductionPctAt10) * clamp(adoptData * 0.4 + adoptAI * 0.6, 0, 1);
    const triageImpact = step * pct(ul.maxManualTriageReductionPctAt10) * clamp(coverageFactor, 0, 1) * clamp(adoptAI * 0.75 + adoptData * 0.25, 0, 1);
    const revisitImpact = step * pct(ul.maxRevisitReductionPctAt10) * clamp(adoptField * 0.55 + adoptData * 0.35 + adoptAI * 0.1, 0, 1);
    const reliabilityImpact = step * pct(ul.maxOutageReductionPctAt10) * clamp(adoptAI, 0, 1) * bf_post3m;
    const emergencyImpact = step * pct(ul.maxEmergencyReductionPctAt10) * clamp(adoptAI, 0, 1) * bf_post3m;
    const curRevisits = baseRevisits * (0.95 + rng() * 0.15);
    const curEmergency = baseEmergency * severity;
    const curOutages = baseOutages * severity;
    const curSAIDI_customerMinutes = baseSAIDI_customerMinutes * severity;
    const curPlatformProcHours = basePlatformProcHours;
    const curManualTriageHours = baseManualTriageHours * severity;
    const ulCapacityGainInspections = baseInspections * step * adoptField * 0.6;
    const ulRevisits = curRevisits * (1 - revisitImpact);
    const ulEmergency = curEmergency * (1 - emergencyImpact);
    const ulOutages = curOutages * (1 - reliabilityImpact);
    const ulSAIDI_customerMinutes = curSAIDI_customerMinutes * (1 - reliabilityImpact);
    const ulPlatformProcHours = curPlatformProcHours * (1 - platformProcImpact);
    const ulManualTriageHours = curManualTriageHours * (1 - triageImpact);
    return { week, isMajorEvent, severity, curRevisits, ulRevisits, curEmergency, ulEmergency, curOutages, ulOutages, curSAIDI_customerMinutes, ulSAIDI_customerMinutes, curPlatformProcHours, ulPlatformProcHours, curManualTriageHours, ulManualTriageHours, ulCapacityGainInspections, bf_field, bf_data, bf_ai, bf_post3m };
  });
  return { rows };
}

function sumRows(rows: WeekRow[], uptoWeek: number) {
  const slice = rows.slice(0, uptoWeek);
  const sum = (k: keyof WeekRow) => slice.reduce((acc, r) => acc + (r[k] as number), 0);
  return { curRevisits: sum("curRevisits"), ulRevisits: sum("ulRevisits"), curEmergency: sum("curEmergency"), ulEmergency: sum("ulEmergency"), curOutages: sum("curOutages"), ulOutages: sum("ulOutages"), curSAIDI: sum("curSAIDI_customerMinutes"), ulSAIDI: sum("ulSAIDI_customerMinutes"), curPlatformProc: sum("curPlatformProcHours"), ulPlatformProc: sum("ulPlatformProcHours"), curTriage: sum("curManualTriageHours"), ulTriage: sum("ulManualTriageHours"), capacityGainInspections: sum("ulCapacityGainInspections") };
}

function calcSavings(cust: CustomerInputs, ul: UlInputs, sums: ReturnType<typeof sumRows>, mode: Mode): SavingsBreakdown {
  const revisitsAvoided = sums.curRevisits - sums.ulRevisits;
  const emergencyAvoided = sums.curEmergency - sums.ulEmergency;
  const outagesAvoided = sums.curOutages - sums.ulOutages;
  const saidiCustomerMinutesAvoided = sums.curSAIDI - sums.ulSAIDI;
  const platformProcHoursSaved = sums.curPlatformProc - sums.ulPlatformProc;
  const manualTriageHoursSaved = sums.curTriage - sums.ulTriage;
  const revisitSavings = revisitsAvoided * cust.costPerRevisit;
  const emergencySavings = emergencyAvoided * cust.costPerEmergencyCallout;
  const platformProcSavings = platformProcHoursSaved * cust.platformProcessingRatePerHour;
  const triageSavings = manualTriageHoursSaved * cust.triageRatePerHour;
  const reliabilityValue = mode === "downstream" ? saidiCustomerMinutesAvoided * ul.valuePerCustomerMinuteSAIDI : 0;
  const total = revisitSavings + emergencySavings + platformProcSavings + triageSavings + reliabilityValue;
  return { revisitsAvoided, emergencyAvoided, outagesAvoided, saidiCustomerMinutesAvoided, platformProcHoursSaved, manualTriageHoursSaved, revisitSavings, emergencySavings, platformProcSavings, triageSavings, reliabilityValue, total, capacityGainInspections: sums.capacityGainInspections };
}

/** ================== AI SCALE SIM ================== */
type AiScaleWeek = { week: number; strongCurrent: number; strongUL: number; inFlightCurrent: number; inFlightUL: number; cumLabelsCurrent: number; cumLabelsUL: number; cumHoursCurrent: number; cumHoursUL: number };
type AiScaleSummary = { current: { weeksToGoal: number; yearsToGoal: number; totalLabels: number; totalHours: number; starterBoostAppliedWeek: number | null }; ul: { weeksToGoal: number; yearsToGoal: number; totalLabels: number; totalHours: number; starterBoostAppliedWeek: number | null }; deltas: { weeksFaster: number; hoursSaved: number; labelsSaved: number } };
type ClassWork = { kind: "upgrade_med" | "upgrade_weak" | "new"; remainingIterations: number };

function simulateAiScale(a: AiScaleInputs, weeks: number): { weeks: AiScaleWeek[]; summary: AiScaleSummary } {
  const target = Math.max(0, a.targetStrongClasses);
  const startStrong = Math.max(0, a.currentStrongClasses);
  const startMed = Math.max(0, a.currentMediumClasses);
  const startWeak = Math.max(0, a.currentWeakClasses);
  const makeScenario = (scenario: "current" | "ul") => {
    const isUL = scenario === "ul";
    const onboarding = isUL ? Math.max(0, a.ulOnboardingWeeks) : 0;
    const starter = isUL ? Math.max(0, a.ulStarterStrongClasses) : 0;
    const labelReduction = isUL ? clamp(pct(a.ulTransferLabelReductionPct), 0, 0.95) : 0;
    const effLabelsPerIter = a.labelsPerClassPerIteration * (1 - labelReduction);
    const iterReduce = isUL ? Math.max(0, a.ulIterationReduction) : 0;
    const iterationsNew = Math.max(1, a.iterationsNewToStrong - iterReduce);
    const itersMedUp = Math.max(0, a.extraIterationsMediumToStrong - Math.min(1, iterReduce));
    const itersWeakUp = Math.max(0, a.extraIterationsWeakToStrong - Math.min(1, iterReduce));
    const parallelism = isUL ? Math.max(1, a.ulParallelism) : Math.max(1, a.currentParallelismLimit);
    const qa = clamp(pct(a.qaOverheadPct), 0, 2);
    const baseLabelsPerWeek = a.deliveryHoursPerWeek * a.labelsPerHour;
    const staticOverhead = !isUL ? clamp(pct(a.currentContextSwitchOverheadPct), 0, 0.9) : 0;
    const effectiveLabelsPerWeek = (baseLabelsPerWeek * (1 - staticOverhead)) / (1 + qa);
    let strong = startStrong;
    const remaining = Math.max(0, target - strong);
    const needFromMed = Math.min(startMed, remaining);
    const remaining2 = remaining - needFromMed;
    const needFromWeak = Math.min(startWeak, remaining2);
    const needNew = remaining2 - needFromWeak;
    const queue: ClassWork[] = [];
    for (let i = 0; i < needFromMed; i++) queue.push({ kind: "upgrade_med", remainingIterations: itersMedUp });
    for (let i = 0; i < needFromWeak; i++) queue.push({ kind: "upgrade_weak", remainingIterations: itersWeakUp });
    for (let i = 0; i < needNew; i++) queue.push({ kind: "new", remainingIterations: iterationsNew });
    let instantStrong = 0;
    const filtered: ClassWork[] = [];
    for (const item of queue) { if (item.remainingIterations <= 0) instantStrong += 1; else filtered.push(item); }
    strong = clamp(strong + instantStrong, 0, target);
    const inflight: ClassWork[] = [];
    let cumLabels = 0;
    let starterAppliedWeek: number | null = null;
    let rrIndex = 0;
    const weekly: Array<{ week: number; strong: number; inflight: number; cumLabels: number; cumHours: number }> = [];
    const pullNext = () => (filtered.length ? filtered.shift()! : null);
    for (let w = 1; w <= weeks; w++) {
      if (isUL && starter > 0 && w === onboarding + 1 && strong < target) { const add = clamp(starter, 0, target - strong); strong += add; starterAppliedWeek = w; }
      while (inflight.length < parallelism) { const next = pullNext(); if (!next) break; inflight.push(next); }
      let labelsBudget = effectiveLabelsPerWeek;
      while (labelsBudget >= effLabelsPerIter && inflight.length > 0 && strong < target) {
        const idx = rrIndex % inflight.length;
        const item = inflight[idx];
        labelsBudget -= effLabelsPerIter;
        cumLabels += effLabelsPerIter;
        item.remainingIterations -= 1;
        if (item.remainingIterations <= 0) { strong = clamp(strong + 1, 0, target); inflight.splice(idx, 1); } else { rrIndex++; }
        while (inflight.length < parallelism) { const next = pullNext(); if (!next) break; inflight.push(next); }
      }
      const cumHours = (cumLabels / Math.max(1e-6, a.labelsPerHour)) * (1 + qa) / Math.max(1e-6, 1 - staticOverhead);
      weekly.push({ week: w, strong, inflight: inflight.length, cumLabels, cumHours });
    }
    const goalWeek = weekly.find((x) => x.strong >= target)?.week ?? weeks + 1;
    const weeksToGoal = goalWeek <= weeks ? goalWeek : weeks + 1;
    let totalLabels = weekly[weekly.length - 1]?.cumLabels ?? 0;
    let totalHours = weekly[weekly.length - 1]?.cumHours ?? 0;
    if (weeksToGoal === weeks + 1) {
      const remItems = [...filtered, ...inflight];
      const remIterations = remItems.reduce((acc, it) => acc + Math.max(0, it.remainingIterations), 0);
      const remLabels = remIterations * effLabelsPerIter;
      totalLabels += remLabels;
      totalHours = (totalLabels / Math.max(1e-6, a.labelsPerHour)) * (1 + qa) / Math.max(1e-6, 1 - staticOverhead);
    }
    const solvedWeeks = weeksToGoal <= weeks ? weeksToGoal : Math.ceil(totalHours / Math.max(1e-6, a.deliveryHoursPerWeek));
    const yearsToGoal = solvedWeeks / 52;
    return { weekly, meta: { weeksToGoal: solvedWeeks, yearsToGoal, totalLabels, totalHours, starterBoostAppliedWeek: starterAppliedWeek } };
  };
  const cur = makeScenario("current");
  const ul = makeScenario("ul");
  const outWeeks: AiScaleWeek[] = [];
  for (let i = 0; i < weeks; i++) {
    const c = cur.weekly[i] ?? cur.weekly[cur.weekly.length - 1];
    const u = ul.weekly[i] ?? ul.weekly[ul.weekly.length - 1];
    outWeeks.push({ week: i + 1, strongCurrent: c?.strong ?? 0, strongUL: u?.strong ?? 0, inFlightCurrent: c?.inflight ?? 0, inFlightUL: u?.inflight ?? 0, cumLabelsCurrent: c?.cumLabels ?? 0, cumLabelsUL: u?.cumLabels ?? 0, cumHoursCurrent: c?.cumHours ?? 0, cumHoursUL: u?.cumHours ?? 0 });
  }
  const summary: AiScaleSummary = { current: cur.meta, ul: ul.meta, deltas: { weeksFaster: cur.meta.weeksToGoal - ul.meta.weeksToGoal, hoursSaved: cur.meta.totalHours - ul.meta.totalHours, labelsSaved: cur.meta.totalLabels - ul.meta.totalLabels } };
  return { weeks: outWeeks, summary };
}

/** ================== Program Simulation ================== */
function simulateProgram(program: ProgramInputs, ul: UlInputs, levers: ProgramUlLevers, targets: ModelTargetInputs) {
  const W = Math.max(1, program.horizonWeeks);
  const rng = makeRng(ul.seed);
  const patrolShare = clamp(program.patrolSharePct, 0, 100);
  const droneShare = clamp(program.droneSharePct, 0, 100);
  const shareSum = patrolShare + droneShare;
  const patrolMix = shareSum > 0 ? patrolShare / shareSum : 0.5;
  const droneMix = shareSum > 0 ? droneShare / shareSum : 0.5;
  const polesPerWeek_patrol_current = program.patrolInspectors * program.patrolPolesPerInspectorPerDay * program.workingDaysPerWeek;
  let polesPerWeek_drone_current = program.dronePilots * program.dronePolesPerPilotPerDay * program.workingDaysPerWeek;
  if (program.droneInspectionMode === "automated") polesPerWeek_drone_current *= 1.12;
  const polesCaptured_current = polesPerWeek_patrol_current * patrolMix + polesPerWeek_drone_current * droneMix;
  const mult = levers.capabilityMultiplier;
  const xSteps = Math.max(1, mult);
  const wPlan = levers.enablePlanInspectBoost && ul.modules.planInspect ? 1 : 0;
  const wData = levers.enableDataManageBoost && ul.modules.dataManage ? 1 : 0;
  const wProc = levers.enableProcessReportBoost && ul.modules.processReport ? 1 : 0;
  const enabledWeight = (wPlan + wData + wProc) / 3;
  const applyBoostPct = (base: number, perX: number, postGate: number) => {
    const totalPct = perX * (xSteps - 1);
    return base * (1 + pct(totalPct) * enabledWeight * (1 + pct(levers.post3MonthBoostPct) * postGate));
  };
  const applyReductionPct = (base: number, perX: number, postGate: number) => {
    const totalPct = perX * (xSteps - 1);
    return base * (1 - clamp(pct(totalPct) * enabledWeight * (1 + pct(levers.post3MonthBoostPct) * postGate), 0, 0.9));
  };
  const reviewersHoursPerWeek = program.assessReviewers * program.reviewerHoursPerDay * program.workingDaysPerWeek;
  let backlogCur = Math.max(0, program.startingBacklogImages);
  let backlogUl = Math.max(0, program.startingBacklogImages);
  const out: ProgramWeek[] = [];
  const captureNoise = () => 0.9 + rng() * 0.25;
  for (let w = 1; w <= W; w++) {
    const postGate = month3Gate(w);
    const curMaturity = maturityAtWeek(w, targets);
    const accel = clamp(pct(levers.modelMaturityAccelerationPct), 0, 0.9);
    const ulTargetByWeek = Math.max(1, Math.round(targets.targetByWeek * (1 - accel)));
    const ulTargets: ModelTargetInputs = { ...targets, targetByWeek: ulTargetByWeek };
    const ulMaturity = maturityAtWeek(w, ulTargets);
    const polesArrivingCur = polesCaptured_current * captureNoise();
    const imagesArrivingCur = polesArrivingCur * program.imagesPerPole;
    const polesArrivingUl = applyBoostPct(polesCaptured_current, levers.captureProductivityBoostPctPerX, postGate) * captureNoise();
    const imagesArrivingUl = polesArrivingUl * program.imagesPerPole;
    const latencyCur = program.fieldToCloudHours + program.assetAssignmentHours + program.aiOverlayHours * curMaturity.aiOverlayHoursMultiplier;
    const fieldToCloudUl = applyReductionPct(program.fieldToCloudHours, levers.fieldToCloudReductionPctPerX, postGate);
    const assignUl = applyReductionPct(program.assetAssignmentHours, levers.assignmentReductionPctPerX, postGate);
    const overlayBaseUl = program.aiOverlayHours * ulMaturity.aiOverlayHoursMultiplier;
    const overlayUl = applyReductionPct(overlayBaseUl, levers.aiOverlayReductionPctPerX, postGate);
    const latencyUl = fieldToCloudUl + assignUl + overlayUl;
    const assessMinsCur = program.manualAssessMinsPerImage * curMaturity.manualAssessMinsMultiplier;
    const annShareCur = clamp(pct(program.percentImagesNeedingAnnotationPct) * curMaturity.annotationShareMultiplier, 0, 1);
    const annMinsCur = program.annotationMinsPerImage * curMaturity.annotationMinsMultiplier;
    const workloadMinsPerImageCur = assessMinsCur + annShareCur * annMinsCur;
    const assessBaseUl = program.manualAssessMinsPerImage * ulMaturity.manualAssessMinsMultiplier;
    const assessMinsUl = applyReductionPct(assessBaseUl, levers.manualAssessReductionPctPerX, postGate);
    const annShareBaseUlPct = program.percentImagesNeedingAnnotationPct * ulMaturity.annotationShareMultiplier;
    const annShareUl = clamp(applyReductionPct(annShareBaseUlPct, levers.percentImagesNeedingAnnotationReductionPctPerX, postGate) / 100, 0, 1);
    const annBaseUl = program.annotationMinsPerImage * ulMaturity.annotationMinsMultiplier;
    const annMinsUl = applyReductionPct(annBaseUl, levers.annotationSpeedBoostPctPerX, postGate);
    const workloadMinsPerImageUl = assessMinsUl + annShareUl * annMinsUl;
    const imagesProcessedCur = Math.max(0, (reviewersHoursPerWeek * 60) / Math.max(1e-6, workloadMinsPerImageCur));
    const imagesProcessedUl = Math.max(0, (reviewersHoursPerWeek * 60) / Math.max(1e-6, workloadMinsPerImageUl));
    backlogCur = Math.max(0, backlogCur + imagesArrivingCur - imagesProcessedCur);
    backlogUl = Math.max(0, backlogUl + imagesArrivingUl - imagesProcessedUl);
    const ttaCur = imagesProcessedCur > 0 ? backlogCur / imagesProcessedCur : Infinity;
    const ttaUl = imagesProcessedUl > 0 ? backlogUl / imagesProcessedUl : Infinity;
    const polesAssessedCur = imagesProcessedCur / Math.max(1, program.imagesPerPole);
    const polesAssessedUl = imagesProcessedUl / Math.max(1, program.imagesPerPole);
    const decisionsCur = polesAssessedCur * program.decisionsPerPole;
    const decisionsUl = polesAssessedUl * program.decisionsPerPole;
    out.push({ week: w, polesCaptured_current: polesArrivingCur, polesCaptured_ul: polesArrivingUl, imagesArriving_current: imagesArrivingCur, imagesArriving_ul: imagesArrivingUl, imagesProcessed_current: imagesProcessedCur, imagesProcessed_ul: imagesProcessedUl, backlogImages_current: backlogCur, backlogImages_ul: backlogUl, timeToAssessWeeks_current: ttaCur, timeToAssessWeeks_ul: ttaUl, decisions_current: decisionsCur, decisions_ul: decisionsUl, latencyHours_current: latencyCur, latencyHours_ul: latencyUl, annotationShare_current: annShareCur, annotationShare_ul: annShareUl, assessMins_current: assessMinsCur, assessMins_ul: assessMinsUl });
  }
  const summarize = (key: "current" | "ul") => {
    const poles = out.reduce((a, r) => a + (key === "current" ? r.polesCaptured_current : r.polesCaptured_ul), 0);
    const images = out.reduce((a, r) => a + (key === "current" ? r.imagesArriving_current : r.imagesArriving_ul), 0);
    const processed = out.reduce((a, r) => a + (key === "current" ? r.imagesProcessed_current : r.imagesProcessed_ul), 0);
    const decisions = out.reduce((a, r) => a + (key === "current" ? r.decisions_current : r.decisions_ul), 0);
    const endingBacklog = key === "current" ? out[out.length - 1].backlogImages_current : out[out.length - 1].backlogImages_ul;
    const tta = out.map((r) => (key === "current" ? r.timeToAssessWeeks_current : r.timeToAssessWeeks_ul)).filter(Number.isFinite);
    const avgTta = tta.reduce((a, x) => a + x, 0) / Math.max(1, tta.length);
    const sorted = [...tta].sort((a, b) => a - b);
    const p90 = sorted.length ? sorted[Math.floor(0.9 * (sorted.length - 1))] : 0;
    const lat = out.map((r) => (key === "current" ? r.latencyHours_current : r.latencyHours_ul));
    const avgLat = lat.reduce((a, x) => a + x, 0) / Math.max(1, lat.length);
    return { totalPoles: poles, totalImages: images, totalProcessed: processed, endingBacklog, avgTimeToAssessWeeks: avgTta, p90TimeToAssessWeeks: p90, avgLatencyHours: avgLat, decisions };
  };
  const sCur = summarize("current");
  const sUl = summarize("ul");
  const summary: ProgramSummary = { current: sCur, ul: sUl, deltas: { backlogReduced: sCur.endingBacklog - sUl.endingBacklog, timeToAssessWeeksReduced: sCur.avgTimeToAssessWeeks - sUl.avgTimeToAssessWeeks, latencyHoursReduced: sCur.avgLatencyHours - sUl.avgLatencyHours, decisionsDelta: sUl.decisions - sCur.decisions, throughputDeltaImages: sUl.totalProcessed - sCur.totalProcessed } };
  return { weeks: out, summary };
}

/** ================== Budget helper ================== */
function calcAvoidedBuild(b: AiBudgetInputs) {
  const incLow = b.budget5y * pct(b.incrementalBuildShareLowPct);
  const incHigh = b.budget5y * pct(b.incrementalBuildShareHighPct);
  const avoidedLow = incLow * pct(b.avoidedBuildLowPct);
  const avoidedHigh = incHigh * pct(b.avoidedBuildHighPct);
  return { avoidedLow, avoidedHigh };
}

/** ================== Export helpers ================== */
function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function downloadJson(filename: string, data: unknown) { downloadText(filename, JSON.stringify(data, null, 2), "application/json;charset=utf-8"); }
function csvEscape(v: unknown) { if (v === null || v === undefined) return ""; const s = String(v); if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`; return s; }
function toCsv(rows: Array<Record<string, unknown>>, headerOrder?: string[]) {
  if (!rows.length) return "";
  const headers = headerOrder?.length ? headerOrder : Object.keys(rows[0]);
  const head = headers.map(csvEscape).join(",");
  const body = rows.map((r) => headers.map((h) => csvEscape(r[h])).join(",")).join("\n");
  return `${head}\n${body}\n`;
}
function openPrintReport(html: string) { const w = window.open("", "_blank", "noopener,noreferrer"); if (!w) return; w.document.open(); w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 250); }

/** ================== Animated Timeline Component ================== */
interface TimelinePhase {
  name: string;
  weekStart: number;
  weekEnd: number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  description: string;
}

function AnimatedTimeline({ currentWeek, totalWeeks, programSim, ul }: { currentWeek: number; totalWeeks: number; programSim: { weeks: ProgramWeek[]; summary: ProgramSummary }; ul: UlInputs }) {
  const phases: TimelinePhase[] = [
    { name: "Onboarding", weekStart: 1, weekEnd: 4, color: "from-blue-500 to-cyan-400", bgColor: "bg-blue-500/10", icon: <Sparkles className="w-4 h-4" />, description: "Foundation & Setup" },
    { name: "Plan & Inspect", weekStart: 4, weekEnd: 12, color: "from-emerald-500 to-teal-400", bgColor: "bg-emerald-500/10", icon: <Target className="w-4 h-4" />, description: "Field Operations Boost" },
    { name: "Data Manage", weekStart: 12, weekEnd: 20, color: "from-violet-500 to-purple-400", bgColor: "bg-violet-500/10", icon: <Database className="w-4 h-4" />, description: "Pipeline Optimization" },
    { name: "Process & Report", weekStart: 20, weekEnd: 28, color: "from-amber-500 to-orange-400", bgColor: "bg-amber-500/10", icon: <BarChart3 className="w-4 h-4" />, description: "AI Workflow Maturity" },
    { name: "Full Throttle", weekStart: 28, weekEnd: totalWeeks, color: "from-rose-500 to-pink-400", bgColor: "bg-rose-500/10", icon: <Zap className="w-4 h-4" />, description: "Maximum Capability" },
  ];

  const currentPhase = phases.find((p) => currentWeek >= p.weekStart && currentWeek <= p.weekEnd) || phases[phases.length - 1];
  const progressPercent = (currentWeek / totalWeeks) * 100;
  const weekData = programSim.weeks[Math.min(currentWeek - 1, programSim.weeks.length - 1)];
  const prevWeekData = programSim.weeks[Math.max(0, currentWeek - 2)];
  const backlogChange = weekData && prevWeekData ? weekData.backlogImages_ul - prevWeekData.backlogImages_ul : 0;
  const ttaChange = weekData && prevWeekData ? weekData.timeToAssessWeeks_ul - prevWeekData.timeToAssessWeeks_ul : 0;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">Unleash Live Timeline</CardTitle>
                <p className="text-slate-400 text-sm">Current vs Unleash — What&apos;s Happening vs What We&apos;re Seeing</p>
              </div>
            </div>
            <Badge className={cn("px-3 py-1 text-sm font-semibold border-0 bg-gradient-to-r", currentPhase.color)}>
              {currentPhase.name} — Week {currentWeek}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Timeline Track */}
          <div className="relative">
            <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%`, background: `linear-gradient(90deg, #3b82f6, #06b6d4, #10b981, #8b5cf6, #f59e0b, #f43f5e)` }} />
            </div>
            <div className="flex justify-between mt-3">
              {phases.map((phase) => {
                const isActive = currentWeek >= phase.weekStart;
                const isCurrent = currentWeek >= phase.weekStart && currentWeek <= phase.weekEnd;
                return (
                  <div key={phase.name} className={cn("flex flex-col items-center gap-2", isActive ? "opacity-100" : "opacity-40")}>
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300", isCurrent ? `bg-gradient-to-br ${phase.color} shadow-lg` : isActive ? "bg-slate-600" : "bg-slate-700")}>
                      <span className="text-white">{phase.icon}</span>
                    </div>
                    <div className="text-center">
                      <p className={cn("text-xs font-medium", isCurrent ? "text-white" : "text-slate-400")}>{phase.name}</p>
                      <p className="text-[10px] text-slate-500">W{phase.weekStart}-{phase.weekEnd}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Week Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/30 p-5 animate-in slide-in-from-left-4 duration-500">
              <div className="absolute top-0 right-0 p-3 opacity-20"><EyeOff className="w-16 h-16 text-rose-400" /></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-rose-500/30"><TrendingUp className="w-4 h-4 text-rose-400" /></div>
                  <h3 className="text-rose-300 font-semibold text-sm uppercase tracking-wider">What&apos;s Happening (Current)</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-slate-300 text-sm">Backlog Accumulating</span><span className="text-rose-400 font-mono font-bold">{weekData ? fmtNum(Math.round(weekData.backlogImages_current)) : "—"}</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300 text-sm">Time to Assess</span><span className="text-rose-400 font-mono font-bold">{weekData ? weekData.timeToAssessWeeks_current.toFixed(1) : "—"} wks</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300 text-sm">Pipeline Latency</span><span className="text-rose-400 font-mono font-bold">{weekData ? weekData.latencyHours_current.toFixed(0) : "—"} hrs</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300 text-sm">Manual Annotation</span><span className="text-rose-400 font-mono font-bold">{weekData ? Math.round(weekData.annotationShare_current * 100) : "—"}%</span></div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 p-5 animate-in slide-in-from-right-4 duration-500">
              <div className="absolute top-0 right-0 p-3 opacity-20"><Eye className="w-16 h-16 text-emerald-400" /></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/30"><TrendingDown className="w-4 h-4 text-emerald-400" /></div>
                  <h3 className="text-emerald-300 font-semibold text-sm uppercase tracking-wider">What We&apos;re Seeing (Unleash)</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Backlog Reducing</span>
                    <div className="flex items-center gap-2">
                      {backlogChange < 0 && <Badge className="bg-emerald-500/30 text-emerald-300 text-xs">↓ {fmtNum(Math.abs(Math.round(backlogChange)))}</Badge>}
                      <span className="text-emerald-400 font-mono font-bold">{weekData ? fmtNum(Math.round(weekData.backlogImages_ul)) : "—"}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Time to Assess</span>
                    <div className="flex items-center gap-2">
                      {ttaChange < 0 && <Badge className="bg-emerald-500/30 text-emerald-300 text-xs">↓ {Math.abs(ttaChange).toFixed(1)}</Badge>}
                      <span className="text-emerald-400 font-mono font-bold">{weekData ? weekData.timeToAssessWeeks_ul.toFixed(1) : "—"} wks</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center"><span className="text-slate-300 text-sm">Pipeline Latency</span><span className="text-emerald-400 font-mono font-bold">{weekData ? weekData.latencyHours_ul.toFixed(0) : "—"} hrs</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300 text-sm">Manual Annotation</span><span className="text-emerald-400 font-mono font-bold">{weekData ? Math.round(weekData.annotationShare_ul * 100) : "—"}%</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Module Activation Status */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: "Plan & Inspect", active: ul.modules.planInspect, week: Math.min(currentWeek, 4), maxWeek: 4, color: "from-emerald-500 to-teal-400", icon: <Target className="w-4 h-4" /> },
              { name: "Data Manage", active: ul.modules.dataManage, week: Math.min(Math.max(0, currentWeek - 4), 8), maxWeek: 8, color: "from-violet-500 to-purple-400", icon: <Database className="w-4 h-4" /> },
              { name: "Process & Report", active: ul.modules.processReport, week: Math.min(Math.max(0, currentWeek - 12), 16), maxWeek: 16, color: "from-amber-500 to-orange-400", icon: <BarChart3 className="w-4 h-4" /> },
            ].map((module) => (
              <div key={module.name} className={cn("relative rounded-xl p-4 border transition-all duration-300", module.active ? "bg-slate-800/80 border-slate-600" : "bg-slate-800/40 border-slate-700/50 opacity-60")}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("p-1.5 rounded-lg", module.active ? `bg-gradient-to-br ${module.color}` : "bg-slate-600")}><span className="text-white">{module.icon}</span></div>
                  <span className={cn("text-sm font-medium", module.active ? "text-white" : "text-slate-500")}>{module.name}</span>
                </div>
                {module.active && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-slate-400">Activation</span><span className="text-slate-300">{Math.round((module.week / module.maxWeek) * 100)}%</span></div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", module.color)} style={{ width: `${(module.week / module.maxWeek) * 100}%` }} />
                    </div>
                  </div>
                )}
                {!module.active && <div className="text-xs text-slate-500 mt-1">Disabled</div>}
              </div>
            ))}
          </div>

          {/* Key Metrics Comparison */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Backlog Reduction", current: weekData?.backlogImages_current ?? 0, unleash: weekData?.backlogImages_ul ?? 0, format: (v: number) => fmtNum(Math.round(v)), lowerIsBetter: true },
              { label: "Images Processed", current: weekData?.imagesProcessed_current ?? 0, unleash: weekData?.imagesProcessed_ul ?? 0, format: (v: number) => fmtNum(Math.round(v)), lowerIsBetter: false },
              { label: "Decisions Made", current: weekData?.decisions_current ?? 0, unleash: weekData?.decisions_ul ?? 0, format: (v: number) => fmtNum(Math.round(v)), lowerIsBetter: false },
              { label: "Poles Captured", current: weekData?.polesCaptured_current ?? 0, unleash: weekData?.polesCaptured_ul ?? 0, format: (v: number) => fmtNum(Math.round(v)), lowerIsBetter: false },
            ].map((metric) => {
              const improvement = metric.lowerIsBetter ? ((metric.current - metric.unleash) / Math.max(metric.current, 1)) * 100 : ((metric.unleash - metric.current) / Math.max(metric.current, 1)) * 100;
              return (
                <div key={metric.label} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 hover:scale-[1.02] transition-transform">
                  <p className="text-xs text-slate-400 mb-2">{metric.label}</p>
                  <div className="flex items-end gap-2">
                    <span className="text-lg font-bold text-rose-400">{metric.format(metric.current)}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <span className="text-lg font-bold text-emerald-400">{metric.format(metric.unleash)}</span>
                  </div>
                  {improvement > 0 && <Badge className="mt-2 bg-emerald-500/20 text-emerald-300 text-xs">+{improvement.toFixed(0)}% improvement</Badge>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Phase Details */}
      <div className="grid grid-cols-5 gap-3">
        {phases.map((phase) => {
          const isActive = currentWeek >= phase.weekStart;
          const isCurrent = currentWeek >= phase.weekStart && currentWeek <= phase.weekEnd;
          return (
            <div key={phase.name} className={cn("relative rounded-xl p-4 border transition-all duration-300", isCurrent ? `bg-gradient-to-br ${phase.color} border-transparent` : isActive ? "bg-slate-800 border-slate-600" : "bg-slate-800/50 border-slate-700/50 opacity-50")}>
              <div className="flex items-center gap-2 mb-2">
                <span className={isCurrent ? "text-white" : "text-slate-400"}>{phase.icon}</span>
                <span className={cn("text-xs font-semibold", isCurrent ? "text-white" : "text-slate-400")}>{phase.name}</span>
              </div>
              <p className={cn("text-[10px]", isCurrent ? "text-white/80" : "text-slate-500")}>{phase.description}</p>
              <div className="mt-2 text-[10px] opacity-60">W{phase.weekStart}-{phase.weekEnd}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** ================== Main Page Component ================== */
export default function Page() {
  const [tab, setTab] = useState<Tab>("ceo");
  const [mode, setMode] = useState<Mode>("conservative");
  const [week, setWeek] = useState(1);
  const [playing, setPlaying] = useState(false);

  const [cust, setCust] = useState<CustomerInputs>({
    orgName: "Your Organisation", customers: 500000, annualSAIDI_min_perCustomer: 160, annualUnplannedOutages: 28000, annualEmergencyCallouts: 9000,
    annualFaultCalls: 100000, annualComplaints: 5000, annualGSLPayments: 4000000, stpisExposure: 11000000, annualInspections: 458000, revisitRatePct: 20,
    imagesPerInspection: 8, costPerRevisit: 500, costPerEmergencyCallout: 20000, platformProcessingHoursPerWeek: 450, platformProcessingRatePerHour: 150,
    pctImagesManualClassified: 75, minsPerImageManualClassify: 0.8, triageRatePerHour: 150,
  });

  const [ul, setUl] = useState<UlInputs>({
    weeks: 52, seed: 42, playbackSpeedMs: 220, stepChangePct: 7,
    modules: { planInspect: true, dataManage: true, processReport: true },
    classesRequired: 200, classesLive: 29, maxPlatformProcessingReductionPctAt10: 20, maxManualTriageReductionPctAt10: 75,
    maxRevisitReductionPctAt10: 30, maxEmergencyReductionPctAt10: 12, maxOutageReductionPctAt10: 10, valuePerCustomerMinuteSAIDI: 0.02,
  });

  const [budget, setBudget] = useState<AiBudgetInputs>({ budget5y: 30300000, incrementalBuildShareLowPct: 30, incrementalBuildShareHighPct: 40, avoidedBuildLowPct: 50, avoidedBuildHighPct: 70 });

  const [aiScale, setAiScale] = useState<AiScaleInputs>({
    currentWeakClasses: 60, currentMediumClasses: 30, currentStrongClasses: 10, targetStrongClasses: 200, deliveryHoursPerWeek: 24,
    labelsPerHour: 120, qaOverheadPct: 20, labelsPerClassPerIteration: 250, iterationsNewToStrong: 3, extraIterationsWeakToStrong: 2,
    extraIterationsMediumToStrong: 1, currentContextSwitchOverheadPct: 20, currentParallelismLimit: 3, ulOnboardingWeeks: 4,
    ulStarterStrongClasses: 20, ulTransferLabelReductionPct: 35, ulIterationReduction: 1, ulParallelism: 10,
  });

  const [program, setProgram] = useState<ProgramInputs>({
    horizonWeeks: 26, patrolInspectors: 40, dronePilots: 10, patrolPolesPerInspectorPerDay: 18, dronePolesPerPilotPerDay: 120,
    droneInspectionMode: "manual", patrolSharePct: 55, droneSharePct: 45, imagesPerPole: 4, workingDaysPerWeek: 5,
    fieldToCloudHours: 18, assetAssignmentHours: 36, aiOverlayHours: 24, manualAssessMinsPerImage: 0.9, annotationMinsPerImage: 1.6,
    percentImagesNeedingAnnotationPct: 20, assessReviewers: 8, reviewerHoursPerDay: 7.5, decisionsPerPole: 1, startingBacklogImages: 50000,
  });

  const [programUl, setProgramUl] = useState<ProgramUlLevers>({
    capabilityMultiplier: 3, enablePlanInspectBoost: true, enableDataManageBoost: true, enableProcessReportBoost: true,
    captureProductivityBoostPctPerX: 15, fieldToCloudReductionPctPerX: 25, assignmentReductionPctPerX: 20, aiOverlayReductionPctPerX: 20,
    manualAssessReductionPctPerX: 18, annotationSpeedBoostPctPerX: 20, percentImagesNeedingAnnotationReductionPctPerX: 12,
    post3MonthBoostPct: 20, modelMaturityAccelerationPct: 35,
  });

  const [modelTargets] = useState<ModelTargetInputs>({ currentTier: "base", targetTier: "robust", targetByWeek: 26 });

  const [assetTargets, setAssetTargets] = useState<AssetTargetingInputs>(() => {
    const selected: Record<AssetComponent, boolean> = Object.keys(COMPONENT_LABELS).reduce((acc, k) => { acc[k as AssetComponent] = false; return acc; }, {} as Record<AssetComponent, boolean>);
    selected["cond_conductor"] = true; selected["dist_insulators"] = true;
    return { selected, imagesPerComponentLow: 200, imagesPerComponentHigh: 300, ulCostPerImage: 0.8, engineersAllocatedCurrent: 2, engineersAllocatedUl: 6 };
  });

  useEffect(() => {
    if (!playing) return;
    const maxWeeks = ul.weeks;
    const t = setInterval(() => setWeek((w) => (w >= maxWeeks ? maxWeeks : w + 1)), ul.playbackSpeedMs);
    return () => clearInterval(t);
  }, [playing, ul.playbackSpeedMs, ul.weeks]);

  useEffect(() => { const maxWeeks = ul.weeks; if (week >= maxWeeks) setPlaying(false); }, [week, ul.weeks]);

  const { rows: opsRows } = useMemo(() => buildWeeks(cust, ul), [cust, ul]);
  const sumsToWeek = useMemo(() => sumRows(opsRows, clamp(week, 1, ul.weeks)), [opsRows, week, ul.weeks]);
  const savingsToWeek = useMemo(() => calcSavings(cust, ul, sumsToWeek, mode), [cust, ul, sumsToWeek, mode]);
  const sumsYear = useMemo(() => sumRows(opsRows, ul.weeks), [opsRows, ul.weeks]);
  const savingsYear = useMemo(() => calcSavings(cust, ul, sumsYear, mode), [cust, ul, sumsYear, mode]);
  const aiSim = useMemo(() => simulateAiScale(aiScale, ul.weeks), [aiScale, ul.weeks]);
  const avoided = useMemo(() => calcAvoidedBuild(budget), [budget]);
  const programSim = useMemo(() => simulateProgram(program, ul, programUl, modelTargets), [program, ul, programUl, modelTargets]);

  const selectedCount = useMemo(() => countSelected(assetTargets.selected), [assetTargets.selected]);
  const estImagesLow = selectedCount * Math.max(0, assetTargets.imagesPerComponentLow);
  const estImagesHigh = selectedCount * Math.max(0, assetTargets.imagesPerComponentHigh);
  const estUlCostLow = estImagesLow * Math.max(0, assetTargets.ulCostPerImage);
  const estUlCostHigh = estImagesHigh * Math.max(0, assetTargets.ulCostPerImage);

  const progIdx = clamp(Math.min(week, program.horizonWeeks), 1, program.horizonWeeks) - 1;
  const programNow = programSim.weeks[progIdx];

  function buildExportPayload() {
    const exportAt = new Date().toISOString();
    return { exportAt, orgName: cust.orgName, mode, customerInputs: cust, unleashLiveInputs: ul, programInputs: program, programUlLevers: programUl, modelTargets, programWeekly: programSim.weeks, programSummary: programSim.summary, assetTargeting: { ...assetTargets, selectedCount, estImagesLow, estImagesHigh, estUlCostLow, estUlCostHigh }, aiScaleInputs: aiScale, aiScaleWeekly: aiSim.weeks, aiScaleSummary: aiSim.summary, opsFinancials: { toWeek: savingsToWeek, fullYear: savingsYear }, aiBudget: { input: budget, avoidedDuplicatedBuild: avoided } };
  }

  function handleExportCsvProgram() {
    const payload = buildExportPayload();
    const slug = safeSlug(cust.orgName);
    const programCsv = toCsv(payload.programWeekly.map((r: ProgramWeek) => ({ week: r.week, poles_current: Math.round(r.polesCaptured_current), poles_ul: Math.round(r.polesCaptured_ul), images_in_current: Math.round(r.imagesArriving_current), images_in_ul: Math.round(r.imagesArriving_ul), processed_current: Math.round(r.imagesProcessed_current), processed_ul: Math.round(r.imagesProcessed_ul), backlog_current: Math.round(r.backlogImages_current), backlog_ul: Math.round(r.backlogImages_ul), tta_weeks_current: round(r.timeToAssessWeeks_current, 3), tta_weeks_ul: round(r.timeToAssessWeeks_ul, 3), latency_hours_current: round(r.latencyHours_current, 2), latency_hours_ul: round(r.latencyHours_ul, 2), annotation_share_current: round(r.annotationShare_current, 3), annotation_share_ul: round(r.annotationShare_ul, 3), assess_mins_current: round(r.assessMins_current, 3), assess_mins_ul: round(r.assessMins_ul, 3), decisions_current: Math.round(r.decisions_current), decisions_ul: Math.round(r.decisions_ul) })));
    downloadText(`${slug}-Program-Weekly.csv`, programCsv, "text/csv;charset=utf-8");
  }

  function handleExportPdf() {
    const payload = buildExportPayload();
    const slug = safeSlug(cust.orgName);
    const s = payload.programSummary;
    const styles = `<style>@page { margin: 18mm; } body { font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial; color:#111; } h1 { font-size: 18px; margin: 0 0 4px; } h2 { font-size: 13px; margin: 18px 0 8px; } .meta { font-size: 11px; color:#444; margin-bottom: 12px; } .grid { display:grid; grid-template-columns: 1fr 1fr; gap:10px; } .card { border:1px solid #ddd; border-radius:12px; padding:10px; } .k { font-size:11px; color:#555; } .v { font-size:16px; font-weight:700; margin-top:2px; } table { border-collapse: collapse; width:100%; font-size: 11px; } th, td { border:1px solid #ddd; padding:6px; vertical-align: top; } th { background:#f5f5f5; text-align:left; }</style>`;
    const html = `<html><head><title>${slug}-CEO-Sim</title>${styles}</head><body><h1>${payload.orgName} — CEO Simulation (Current vs Unleash live)</h1><div class="meta">Exported: ${payload.exportAt}</div><h2>Program delivery summary (horizon ${payload.programInputs.horizonWeeks} weeks)</h2><div class="grid"><div class="card"><div class="k">Current — ending backlog (images)</div><div class="v">${Math.round(s.current.endingBacklog).toLocaleString()}</div><div class="k" style="margin-top:6px;">Avg time-to-assess (weeks)</div><div class="v">${s.current.avgTimeToAssessWeeks.toFixed(2)}</div><div class="k" style="margin-top:6px;">Avg pipeline latency (hours)</div><div class="v">${s.current.avgLatencyHours.toFixed(1)}</div></div><div class="card"><div class="k">Unleash live — ending backlog (images)</div><div class="v">${Math.round(s.ul.endingBacklog).toLocaleString()}</div><div class="k" style="margin-top:6px;">Avg time-to-assess (weeks)</div><div class="v">${s.ul.avgTimeToAssessWeeks.toFixed(2)}</div><div class="k" style="margin-top:6px;">Avg pipeline latency (hours)</div><div class="v">${s.ul.avgLatencyHours.toFixed(1)}</div></div></div><h2>Delta</h2><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody><tr><td>Backlog reduced (images)</td><td>${Math.round(s.deltas.backlogReduced).toLocaleString()}</td></tr><tr><td>Avg time-to-assess reduced (weeks)</td><td>${s.deltas.timeToAssessWeeksReduced.toFixed(2)}</td></tr><tr><td>Latency reduced (hours)</td><td>${s.deltas.latencyHoursReduced.toFixed(1)}</td></tr><tr><td>Decisions delta</td><td>${Math.round(s.deltas.decisionsDelta).toLocaleString()}</td></tr><tr><td>Throughput delta (images processed)</td><td>${Math.round(s.deltas.throughputDeltaImages).toLocaleString()}</td></tr></tbody></table><h2>Asset targeting (model creation)</h2><table><thead><tr><th>Selected components</th><th>Est. images (low)</th><th>Est. images (high)</th><th>UL cost (low)</th><th>UL cost (high)</th></tr></thead><tbody><tr><td>${payload.assetTargeting.selectedCount}</td><td>${payload.assetTargeting.estImagesLow.toLocaleString()}</td><td>${payload.assetTargeting.estImagesHigh.toLocaleString()}</td><td>$${payload.assetTargeting.estUlCostLow.toLocaleString(undefined,{maximumFractionDigits:0})}</td><td>$${payload.assetTargeting.estUlCostHigh.toLocaleString(undefined,{maximumFractionDigits:0})}</td></tr></tbody></table></body></html>`;
    openPrintReport(html);
  }

  function applyPreset(p: "bau" | "stress" | "major-event") {
    setUl((prev) => ({ ...prev, stepChangePct: p === "bau" ? 5 : p === "stress" ? 7 : 9 }));
    setProgramUl((prev) => ({ ...prev, capabilityMultiplier: p === "bau" ? 2 : p === "stress" ? 3 : 4, modelMaturityAccelerationPct: p === "bau" ? 25 : p === "stress" ? 35 : 45 }));
    setProgram((prev) => ({ ...prev, startingBacklogImages: p === "bau" ? 35000 : p === "stress" ? 50000 : 80000 }));
    setWeek(1); setPlaying(false);
  }

  const currentBacklog = programNow?.backlogImages_current ?? 0;
  const ulBacklog = programNow?.backlogImages_ul ?? 0;
  const currentTta = programNow?.timeToAssessWeeks_current ?? 0;
  const ulTta = programNow?.timeToAssessWeeks_ul ?? 0;
  const currentLatency = programNow?.latencyHours_current ?? 0;
  const ulLatency = programNow?.latencyHours_ul ?? 0;
  const annCurPct = Math.round((programNow?.annotationShare_current ?? 0) * 100);
  const annUlPct = Math.round((programNow?.annotationShare_ul ?? 0) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600"><Zap className="w-6 h-6 text-white" /></div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{cust.orgName}</h1>
            </div>
            <p className="mt-2 text-slate-600 max-w-xl">CEO Playback Simulator — Watch backlog, time-to-assess, and latency collapse as Unleash Live capability accelerates your operations.</p>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList className="bg-slate-200/80">
              <TabsTrigger value="ceo" className="data-[state=active]:bg-white">CEO View</TabsTrigger>
              <TabsTrigger value="drilldown" className="data-[state=active]:bg-white">Drilldown</TabsTrigger>
              <TabsTrigger value="ai-scale" className="data-[state=active]:bg-white">AI Scale</TabsTrigger>
              <TabsTrigger value="ops" className="data-[state=active]:bg-white">Ops</TabsTrigger>
              <TabsTrigger value="ai-budget" className="data-[state=active]:bg-white">Budget</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Playback Controls */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Play className="w-5 h-5 text-indigo-600" />Playback Control</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Button onClick={() => setPlaying((p) => !p)} className={cn("flex-1", playing ? "bg-amber-500 hover:bg-amber-600" : "bg-indigo-600 hover:bg-indigo-700")}>{playing ? <><Pause className="w-4 h-4 mr-2" /> Pause</> : <><Play className="w-4 h-4 mr-2" /> Play</>}</Button>
                <Button variant="outline" onClick={() => { setPlaying(false); setWeek(1); }}><RotateCcw className="w-4 h-4 mr-2" /> Reset</Button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-600">Week {week} of {ul.weeks}</span><span className="text-slate-400">{Math.round((week / ul.weeks) * 100)}% complete</span></div>
                <Slider value={[week]} onValueChange={([v]) => { setPlaying(false); setWeek(v); }} max={ul.weeks} min={1} step={1} className="w-full" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => applyPreset("bau")} className="flex-1">BAU</Button>
                <Button variant="outline" size="sm" onClick={() => applyPreset("stress")} className="flex-1">Stress</Button>
                <Button variant="outline" size="sm" onClick={() => applyPreset("major-event")} className="flex-1">Major Event</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-50 to-orange-50">
            <CardHeader className="pb-3"><CardTitle className="text-lg text-rose-800">Current State</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-rose-600 uppercase tracking-wider">Backlog</p><p className="text-2xl font-bold text-rose-700">{fmtNum(Math.round(currentBacklog))}</p></div>
                <div><p className="text-xs text-rose-600 uppercase tracking-wider">TTA</p><p className="text-2xl font-bold text-rose-700">{currentTta.toFixed(1)}w</p></div>
                <div><p className="text-xs text-rose-600 uppercase tracking-wider">Latency</p><p className="text-2xl font-bold text-rose-700">{currentLatency.toFixed(0)}h</p></div>
                <div><p className="text-xs text-rose-600 uppercase tracking-wider">Annotation</p><p className="text-2xl font-bold text-rose-700">{annCurPct}%</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-cyan-50">
            <CardHeader className="pb-3"><CardTitle className="text-lg text-emerald-800">Unleash Live</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-emerald-600 uppercase tracking-wider">Backlog</p><p className="text-2xl font-bold text-emerald-700">{fmtNum(Math.round(ulBacklog))}</p><Badge className="mt-1 bg-emerald-500/20 text-emerald-700 text-xs">↓ {fmtNum(Math.round(currentBacklog - ulBacklog))}</Badge></div>
                <div><p className="text-xs text-emerald-600 uppercase tracking-wider">TTA</p><p className="text-2xl font-bold text-emerald-700">{ulTta.toFixed(1)}w</p><Badge className="mt-1 bg-emerald-500/20 text-emerald-700 text-xs">↓ {(currentTta - ulTta).toFixed(1)}w</Badge></div>
                <div><p className="text-xs text-emerald-600 uppercase tracking-wider">Latency</p><p className="text-2xl font-bold text-emerald-700">{ulLatency.toFixed(0)}h</p><Badge className="mt-1 bg-emerald-500/20 text-emerald-700 text-xs">↓ {(currentLatency - ulLatency).toFixed(0)}h</Badge></div>
                <div><p className="text-xs text-emerald-600 uppercase tracking-wider">Annotation</p><p className="text-2xl font-bold text-emerald-700">{annUlPct}%</p><Badge className="mt-1 bg-emerald-500/20 text-emerald-700 text-xs">↓ {annCurPct - annUlPct}%</Badge></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Animated Timeline */}
        <div className="mb-8 animate-in fade-in zoom-in-95 duration-500">
          <AnimatedTimeline currentWeek={week} totalWeeks={ul.weeks} programSim={programSim} ul={ul} />
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-500">
          {tab === "ceo" && (
            <div className="space-y-6">
              {/* CEO Inputs */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div><CardTitle className="text-xl">CEO Inputs</CardTitle><p className="text-slate-500 text-sm mt-1">The numbers that matter most to executive decision-making</p></div>
                    <div className="flex gap-2">
                      <Button variant={mode === "conservative" ? "default" : "outline"} onClick={() => setMode("conservative")} size="sm">Conservative</Button>
                      <Button variant={mode === "downstream" ? "default" : "outline"} onClick={() => setMode("downstream")} size="sm">Downstream</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Organisation Name</Label><Input value={cust.orgName} onChange={(e) => setCust((p) => ({ ...p, orgName: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>5Y STPIS Exposure</Label><Input type="number" value={cust.stpisExposure} onChange={(e) => setCust((p) => ({ ...p, stpisExposure: Number(e.target.value) }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[{ label: "Customers", key: "customers" as const }, { label: "SAIDI (min/cust)", key: "annualSAIDI_min_perCustomer" as const }, { label: "Unplanned Outages/yr", key: "annualUnplannedOutages" as const }, { label: "Emergency Callouts/yr", key: "annualEmergencyCallouts" as const }].map((field) => (
                      <div key={field.key} className="space-y-2"><Label className="text-xs">{field.label}</Label><Input type="number" value={cust[field.key]} onChange={(e) => setCust((p) => ({ ...p, [field.key]: Number(e.target.value) }))} /></div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[{ label: "Inspections/yr", key: "annualInspections" as const }, { label: "Revisit Rate %", key: "revisitRatePct" as const }, { label: "$ / Revisit", key: "costPerRevisit" as const }, { label: "$ / Emergency", key: "costPerEmergencyCallout" as const }].map((field) => (
                      <div key={field.key} className="space-y-2"><Label className="text-xs">{field.label}</Label><Input type="number" value={cust[field.key]} onChange={(e) => setCust((p) => ({ ...p, [field.key]: Number(e.target.value) }))} /></div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Current State */}
              <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-600" />Current State Delivery Loop</CardTitle><p className="text-slate-500 text-sm">How fast imagery arrives vs how fast it becomes decisions</p></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Horizon (weeks)</Label><Input type="number" value={program.horizonWeeks} onChange={(e) => setProgram((p) => ({ ...p, horizonWeeks: Math.max(1, Number(e.target.value)) }))} /></div>
                    <div className="space-y-2"><Label>Working Days/Week</Label><Input type="number" value={program.workingDaysPerWeek} onChange={(e) => setProgram((p) => ({ ...p, workingDaysPerWeek: clamp(Number(e.target.value), 1, 7) }))} /></div>
                    <div className="space-y-2"><Label>Images per Pole</Label><Input type="number" value={program.imagesPerPole} onChange={(e) => setProgram((p) => ({ ...p, imagesPerPole: Math.max(1, Number(e.target.value)) }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[{ label: "Patrol Inspectors", key: "patrolInspectors" as const }, { label: "Drone Pilots", key: "dronePilots" as const }, { label: "Poles/Inspector/Day", key: "patrolPolesPerInspectorPerDay" as const }, { label: "Poles/Pilot/Day", key: "dronePolesPerPilotPerDay" as const }].map((field) => (
                      <div key={field.key} className="space-y-2"><Label className="text-xs">{field.label}</Label><Input type="number" value={program[field.key]} onChange={(e) => setProgram((p) => ({ ...p, [field.key]: Math.max(0, Number(e.target.value)) }))} /></div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Field→Cloud (hrs)</Label><Input type="number" value={program.fieldToCloudHours} onChange={(e) => setProgram((p) => ({ ...p, fieldToCloudHours: Math.max(0, Number(e.target.value)) }))} /></div>
                    <div className="space-y-2"><Label>Asset Assignment (hrs)</Label><Input type="number" value={program.assetAssignmentHours} onChange={(e) => setProgram((p) => ({ ...p, assetAssignmentHours: Math.max(0, Number(e.target.value)) }))} /></div>
                    <div className="space-y-2"><Label>AI Overlay (hrs)</Label><Input type="number" value={program.aiOverlayHours} onChange={(e) => setProgram((p) => ({ ...p, aiOverlayHours: Math.max(0, Number(e.target.value)) }))} /></div>
                  </div>
                </CardContent>
              </Card>

              {/* Unleash Live */}
              <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" />Unleash Live Capability</CardTitle><p className="text-slate-500 text-sm">Turn the dial and watch the step-change unfold</p></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2"><Label>Capability Pack (2-5x)</Label><Input type="number" min={2} max={5} value={programUl.capabilityMultiplier} onChange={(e) => setProgramUl((p) => ({ ...p, capabilityMultiplier: clamp(Number(e.target.value), 2, 5) as 2 | 3 | 4 | 5 }))} /></div>
                    <div className="space-y-2"><Label>Maturity Acceleration %</Label><Input type="number" value={programUl.modelMaturityAccelerationPct} onChange={(e) => setProgramUl((p) => ({ ...p, modelMaturityAccelerationPct: clamp(Number(e.target.value), 0, 90) }))} /></div>
                    <div className="space-y-2"><Label>Post-3M Boost %</Label><Input type="number" value={programUl.post3MonthBoostPct} onChange={(e) => setProgramUl((p) => ({ ...p, post3MonthBoostPct: clamp(Number(e.target.value), 0, 100) }))} /></div>
                    <div className="space-y-2"><Label>Step-Change %</Label><Input type="number" value={ul.stepChangePct} onChange={(e) => setUl((p) => ({ ...p, stepChangePct: clamp(Number(e.target.value), 1, 10) }))} /></div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Module Activation</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {[{ label: "Plan & Inspect", key: "planInspect" as const, desc: "Capture productivity + fewer repeats" }, { label: "Data Manage", key: "dataManage" as const, desc: "Sync + assignment speed" }, { label: "Process & Report", key: "processReport" as const, desc: "AI overlay + workflow efficiency" }].map((mod) => (
                        <div key={mod.key} className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer", ul.modules[mod.key] ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300")} onClick={() => setUl((p) => ({ ...p, modules: { ...p.modules, [mod.key]: !p.modules[mod.key] } }))}>
                          <div className="flex items-center justify-between mb-2"><span className="font-medium text-sm">{mod.label}</span><Switch checked={ul.modules[mod.key]} /></div>
                          <p className="text-xs text-slate-500">{mod.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Target Components */}
              <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Layers className="w-5 h-5 text-violet-600" />Target Components</CardTitle><p className="text-slate-500 text-sm">Select components to scale next</p></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Images/Component (Low)</Label><Input type="number" value={assetTargets.imagesPerComponentLow} onChange={(e) => setAssetTargets((p) => ({ ...p, imagesPerComponentLow: Math.max(0, Number(e.target.value)) }))} /></div>
                    <div className="space-y-2"><Label>Images/Component (High)</Label><Input type="number" value={assetTargets.imagesPerComponentHigh} onChange={(e) => setAssetTargets((p) => ({ ...p, imagesPerComponentHigh: Math.max(0, Number(e.target.value)) }))} /></div>
                    <div className="space-y-2"><Label>UL $/Image</Label><Input type="number" value={assetTargets.ulCostPerImage} onChange={(e) => setAssetTargets((p) => ({ ...p, ulCostPerImage: Math.max(0, Number(e.target.value)) }))} /></div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4"><p className="text-xs text-slate-500 uppercase">Selected</p><p className="text-2xl font-bold">{selectedCount}</p></div>
                    <div className="bg-slate-50 rounded-xl p-4"><p className="text-xs text-slate-500 uppercase">Images (Low)</p><p className="text-2xl font-bold">{fmtNum(estImagesLow)}</p></div>
                    <div className="bg-slate-50 rounded-xl p-4"><p className="text-xs text-slate-500 uppercase">Images (High)</p><p className="text-2xl font-bold">{fmtNum(estImagesHigh)}</p></div>
                    <div className="bg-slate-50 rounded-xl p-4"><p className="text-xs text-slate-500 uppercase">UL Cost Range</p><p className="text-lg font-bold">{fmtMoney(estUlCostLow)}–{fmtMoney(estUlCostHigh)}</p></div>
                  </div>
                  <div className="space-y-4">
                    {COMPONENT_GROUPS.map((group) => (
                      <div key={group.title}>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">{group.title}</h4>
                        <div className="flex flex-wrap gap-2">
                          {group.keys.map((key) => (
                            <Badge key={key} variant={assetTargets.selected[key] ? "default" : "outline"} className={cn("cursor-pointer px-3 py-1.5", assetTargets.selected[key] ? "bg-indigo-600 hover:bg-indigo-700" : "hover:bg-slate-100")} onClick={() => setAssetTargets((p) => ({ ...p, selected: { ...p.selected, [key]: !p.selected[key] } }))}>
                              {COMPONENT_LABELS[key]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Exports */}
              <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Download className="w-5 h-5 text-slate-600" />Exports</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => downloadJson(`${safeSlug(cust.orgName)}-CEO-Sim.json`, buildExportPayload())}><Database className="w-4 h-4 mr-2" /> Export JSON</Button>
                    <Button onClick={handleExportCsvProgram}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
                    <Button variant="outline" onClick={handleExportPdf}><FileText className="w-4 h-4 mr-2" /> Export PDF</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {tab === "drilldown" && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle>Program Drilldown</CardTitle><p className="text-slate-500 text-sm">Weekly breakdown of all metrics</p></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Week</th>
                          <th className="px-4 py-3 text-left font-medium">Poles (Cur)</th>
                          <th className="px-4 py-3 text-left font-medium">Poles (UL)</th>
                          <th className="px-4 py-3 text-left font-medium">Images In (Cur)</th>
                          <th className="px-4 py-3 text-left font-medium">Images In (UL)</th>
                          <th className="px-4 py-3 text-left font-medium">Processed (Cur)</th>
                          <th className="px-4 py-3 text-left font-medium">Processed (UL)</th>
                          <th className="px-4 py-3 text-left font-medium">Backlog (Cur)</th>
                          <th className="px-4 py-3 text-left font-medium">Backlog (UL)</th>
                          <th className="px-4 py-3 text-left font-medium">TTA (Cur)</th>
                          <th className="px-4 py-3 text-left font-medium">TTA (UL)</th>
                          <th className="px-4 py-3 text-left font-medium">Decisions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {programSim.weeks.map((r) => (
                          <tr key={r.week} className={cn("border-t", r.week === Math.min(week, program.horizonWeeks) ? "bg-indigo-50" : "")}>
                            <td className="px-4 py-3 font-medium">W{r.week}</td>
                            <td className="px-4 py-3">{fmtNum(Math.round(r.polesCaptured_current))}</td>
                            <td className="px-4 py-3">{fmtNum(Math.round(r.polesCaptured_ul))}</td>
                            <td className="px-4 py-3">{fmtNum(Math.round(r.imagesArriving_current))}</td>
                            <td className="px-4 py-3">{fmtNum(Math.round(r.imagesArriving_ul))}</td>
                            <td className="px-4 py-3">{fmtNum(Math.round(r.imagesProcessed_current))}</td>
                            <td className="px-4 py-3">{fmtNum(Math.round(r.imagesProcessed_ul))}</td>
                            <td className="px-4 py-3 text-rose-600">{fmtNum(Math.round(r.backlogImages_current))}</td>
                            <td className="px-4 py-3 text-emerald-600">{fmtNum(Math.round(r.backlogImages_ul))}</td>
                            <td className="px-4 py-3">{r.timeToAssessWeeks_current.toFixed(2)}</td>
                            <td className="px-4 py-3">{r.timeToAssessWeeks_ul.toFixed(2)}</td>
                            <td className="px-4 py-3">{fmtNum(Math.round(r.decisions_current))} / {fmtNum(Math.round(r.decisions_ul))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {tab === "ai-scale" && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle className="flex items-center gap-2"><Cpu className="w-5 h-5 text-violet-600" />AI Scale Simulation</CardTitle><p className="text-slate-500 text-sm">Time to move classes to &quot;Strong&quot; — Current vs Unleash Live</p></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl p-4"><p className="text-xs text-rose-600 uppercase">Current Weeks</p><p className="text-3xl font-bold text-rose-700">{aiSim.summary.current.weeksToGoal}</p></div>
                    <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl p-4"><p className="text-xs text-emerald-600 uppercase">UL Weeks</p><p className="text-3xl font-bold text-emerald-700">{aiSim.summary.ul.weeksToGoal}</p></div>
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4"><p className="text-xs text-indigo-600 uppercase">Weeks Faster</p><p className="text-3xl font-bold text-indigo-700">{aiSim.summary.deltas.weeksFaster}</p></div>
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4"><p className="text-xs text-amber-600 uppercase">Hours Saved</p><p className="text-3xl font-bold text-amber-700">{fmtNum(Math.round(aiSim.summary.deltas.hoursSaved))}</p></div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {[{ label: "Weak Classes", key: "currentWeakClasses" as const }, { label: "Medium Classes", key: "currentMediumClasses" as const }, { label: "Strong Classes", key: "currentStrongClasses" as const }, { label: "Target Strong", key: "targetStrongClasses" as const }].map((field) => (
                      <div key={field.key} className="space-y-2"><Label className="text-xs">{field.label}</Label><Input type="number" value={aiScale[field.key]} onChange={(e) => setAiScale((p) => ({ ...p, [field.key]: Number(e.target.value) }))} /></div>
                    ))}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Week</th>
                          <th className="px-4 py-3 text-left font-medium">Strong (Cur)</th>
                          <th className="px-4 py-3 text-left font-medium">Strong (UL)</th>
                          <th className="px-4 py-3 text-left font-medium">In-Flight (Cur)</th>
                          <th className="px-4 py-3 text-left font-medium">In-Flight (UL)</th>
                          <th className="px-4 py-3 text-left font-medium">Labels (Cur)</th>
                          <th className="px-4 py-3 text-left font-medium">Labels (UL)</th>
                          <th className="px-4 py-3 text-left font-medium">Hours (Cur)</th>
                          <th className="px-4 py-3 text-left font-medium">Hours (UL)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aiSim.weeks.filter((r) => r.week === 1 || r.week === 4 || r.week === 12 || r.week === 26 || r.week === 52 || Math.abs(r.week - week) <= 1).map((r) => (
                          <tr key={r.week} className={cn("border-t", r.week === week ? "bg-indigo-50" : "")}>
                            <td className="px-4 py-3 font-medium">W{r.week}</td>
                            <td className="px-4 py-3">{r.strongCurrent}</td>
                            <td className="px-4 py-3">{r.strongUL}</td>
                            <td className="px-4 py-3">{r.inFlightCurrent}</td>
                            <td className="px-4 py-3">{r.inFlightUL}</td>
                            <td className="px-4 py-3">{fmtNum(Math.round(r.cumLabelsCurrent))}</td>
                            <td className="px-4 py-3">{fmtNum(Math.round(r.cumLabelsUL))}</td>
                            <td className="px-4 py-3">{fmtNum(Math.round(r.cumHoursCurrent))}</td>
                            <td className="px-4 py-3">{fmtNum(Math.round(r.cumHoursUL))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {tab === "ops" && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" />Operations Financials</CardTitle><p className="text-slate-500 text-sm">Annual view — kept light, but honest</p></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4"><p className="text-xs text-indigo-600 uppercase">Full Year Value</p><p className="text-2xl font-bold text-indigo-700">{fmtMoney(savingsYear.total)}</p></div>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4"><p className="text-xs text-emerald-600 uppercase">Triage Savings</p><p className="text-2xl font-bold text-emerald-700">{fmtMoney(savingsYear.triageSavings)}</p></div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4"><p className="text-xs text-amber-600 uppercase">Platform Savings</p><p className="text-2xl font-bold text-amber-700">{fmtMoney(savingsYear.platformProcSavings)}</p></div>
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4"><p className="text-xs text-rose-600 uppercase">Revisit Savings</p><p className="text-2xl font-bold text-rose-700">{fmtMoney(savingsYear.revisitSavings)}</p></div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-medium text-slate-700 mb-2">How to use this in exec conversation</h4>
                    <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                      <li>Keep it conservative: revisits + emergency + hours saved</li>
                      <li>If pushed, switch to downstream for SAIDI value proxy (still transparent)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {tab === "ai-budget" && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-600" />5-Year Budget Protection</CardTitle><p className="text-slate-500 text-sm">Avoided duplicated build effort</p></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-5 gap-4">
                    {[{ label: "5Y Budget", key: "budget5y" as const }, { label: "Build Share Low %", key: "incrementalBuildShareLowPct" as const }, { label: "Build Share High %", key: "incrementalBuildShareHighPct" as const }, { label: "Avoid Low %", key: "avoidedBuildLowPct" as const }, { label: "Avoid High %", key: "avoidedBuildHighPct" as const }].map((field) => (
                      <div key={field.key} className="space-y-2"><Label className="text-xs">{field.label}</Label><Input type="number" value={budget[field.key]} onChange={(e) => setBudget((p) => ({ ...p, [field.key]: Number(e.target.value) }))} /></div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4"><p className="text-xs text-emerald-600 uppercase">Avoided Build (Low)</p><p className="text-2xl font-bold text-emerald-700">{fmtMoney(avoided.avoidedLow)}</p></div>
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4"><p className="text-xs text-indigo-600 uppercase">Avoided Build (High)</p><p className="text-2xl font-bold text-indigo-700">{fmtMoney(avoided.avoidedHigh)}</p></div>
                    <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl p-4"><p className="text-xs text-rose-600 uppercase">STPIS Context</p><p className="text-2xl font-bold text-rose-700">{fmtMoney(cust.stpisExposure)}</p></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-slate-400 animate-in fade-in duration-500">
          Tip: In a CEO demo, stay on <b>CEO View</b>, change only (1) inputs, (2) capability pack, (3) maturity accel, (4) components — then press play.
        </div>
      </div>
    </div>
  );
}
