import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import ClientPicker from "./ClientPicker";
type Zone = "red" | "yellow" | "green" | "gray";

type FormState = {
  clientName: string;
  email: string;
  ghlContactId: string;
  date: string;
  coach: string;
  age: string;
  sex: string;
  goal: string;
  complaint: string;
  trxSquat: string;
  hipHinge: string;
  trxRow: string;
  overheadReach: string;
  ankleLeft: string;
  ankleRight: string;
  aslrLeft: string;
  aslrRight: string;
  floorAccess: string;
  plankMovement: string;
  plankTime: string;
  farmerCarry: string;
  farmerNotes: string;
  sitToStand: string;
  sitToStandStatus: string;
  gripLeft: string;
  gripRight: string;
  balanceLeft: string;
  balanceRight: string;
  topLimitingFactors: string;
  recommendedPath: string;
  recommendedFrequency: string;
  recommendedPrice: string;
  coachNotes: string;
};
type MetricCard = {
    title: string;
    value: string;
    target: string;
    zone: Zone;
    why: string;
    numericValue: number | null;
    maxValue: number;
};

type AssessmentRow = {
    id: string;
    created_at: string | null;
    client_name: string | null;
    email: string | null;
    ghl_contact_id: string | null;
    assessment_date: string | null;
    coach: string | null;
    age: number | null;
    sex: string | null;
    goal: string | null;
    complaint: string | null;

    trx_squat: number | null;
    hip_hinge: number | null;
    trx_row: number | null;
    overhead_reach: number | null;
    ankle_left: number | null;
    ankle_right: number | null;
    aslr_left: number | null;
    aslr_right: number | null;
    floor_access: string | null;
    plank_movement: number | null;

    plank_time: number | null;
    farmer_carry: number | null;
    farmer_notes: string | null;
    sit_to_stand: number | null;
    sit_to_stand_status: string | null;
    grip_left: number | null;
    grip_right: number | null;
    balance_left: number | null;
    balance_right: number | null;

    top_limiting_factors: string | null;
    recommended_path: string | null;
    recommended_frequency: string | null;
    recommended_price: string | null;
    coach_notes: string | null;

    movement_total: number | null;
    movement_max: number | null;
    movement_pct: number | null;
    best_grip: number | null;
    best_balance: number | null;
    fsf_functional_strength_score: number | null;
    fsf_score_zone: string | null;
    fsf_score_label: string | null;
    fsf_score_interpretation: string | null;
    summary_text: string | null;
    recommendation_text: string | null;
    functional_age: number | null;
};

const movementOptions = [
    { value: "", label: "Select score" },
    { value: "2", label: "2 - Clean" },
    { value: "1", label: "1 - Compensation" },
    { value: "0", label: "0 - Pain / Unable" },
];

const floorOptions = [
  "",
  "Can get on and off floor independently",
  "Needs assistance",
  "Cannot get on or off floor",
  "Can do one but not both",
];

const pathOptions = [
  "",
  "Green Path - Ready to train",
  "Yellow Path - Movement prep + strength",
  "Red Path - Corrective entry point",
];

const initialForm: FormState = {
  clientName: "",
  email: "",
  ghlContactId: "",
  date: "",
  coach: "Ron",
  age: "63",
  sex: "Female",
  goal: "Stay strong, independent, and confident",
  complaint: "Poor balance and lower body weakness",
  trxSquat: "",
  hipHinge: "",
  trxRow: "",
  overheadReach: "",
  ankleLeft: "",
  ankleRight: "",
  aslrLeft: "",
  aslrRight: "",
  floorAccess: "",
  plankMovement: "",
  plankTime: "",
  farmerCarry: "",
  farmerNotes: "",
  sitToStand: "",
  sitToStandStatus: "",
  gripLeft: "",
  gripRight: "",
  balanceLeft: "",
  balanceRight: "",
  topLimitingFactors: "Lower body strength, balance, and grip weakness",
  recommendedFrequency: "",
  recommendedPrice: "",
  recommendedPath: "",
  coachNotes:
    "Focus on lower body strength, floor confidence, balance, and core stability over the next 8–12 weeks.",
};

function getZone(value: number | null, redMax: number, yellowMax: number): Zone {
  if (value === null || value === undefined || Number.isNaN(value)) return "gray";
  if (value <= redMax) return "red";
  if (value <= yellowMax) return "yellow";
  return "green";
}

function getSexSpecificGripZone(value: number | null, sex: string): Zone {
  if (value === null || value === undefined || Number.isNaN(value)) return "gray";
  if (sex === "Female") {
    if (value < 40) return "red";
    if (value < 65) return "yellow";
    return "green";
  }
  if (sex === "Male") {
    if (value < 65) return "red";
    if (value < 95) return "yellow";
    return "green";
  }
  if (value < 50) return "red";
  if (value < 80) return "yellow";
  return "green";
}

function zoneClasses(zone: Zone): string {
  switch (zone) {
    case "red":
      return "bg-red-100 text-red-700 border-red-200";
    case "yellow":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "green":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-slate-100 text-slate-500 border-slate-200";
  }
}

function zoneText(zone: Zone): string {
  if (zone === "red") return "Red";
  if (zone === "yellow") return "Yellow";
  if (zone === "green") return "Green";
  return "Not scored";
}

function markerPosition(value: number | null, min: number, max: number): number {
  if (value === null || value === undefined || Number.isNaN(value)) return 0;
  const pct = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, pct));
}

function toneClass(zone: Zone): string {
  switch (zone) {
    case "red":
      return "text-red-600";
    case "yellow":
      return "text-yellow-600";
    case "green":
      return "text-green-600";
    default:
      return "text-slate-500";
  }
}

function ZoneMeter({
  value,
  min,
  max,
  labels,
}: {
  value: number | null;
  min: number;
  max: number;
  labels: string[];
}) {
  const pos = markerPosition(value, min, max);
  return (
    <div className="mt-2">
      <div className="relative h-3 w-full overflow-hidden rounded-full border bg-slate-100">
        <div className="grid h-full grid-cols-3">
          <div className="bg-red-500/70" />
          <div className="bg-yellow-400/80" />
          <div className="bg-green-500/70" />
        </div>
        {value !== null && value !== undefined && !Number.isNaN(value) && (
          <div
            className="absolute top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-slate-900 shadow"
            style={{ left: `calc(${pos}% - 2px)` }}
          />
        )}
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        {labels.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function ScoreBadge({ zone }: { zone: Zone }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${zoneClasses(zone)}`}>
      {zoneText(zone).toUpperCase()}
    </span>
  );
}

export default function FSFAssessmentWireframe() {
  const sectionTitle = "text-xl font-bold tracking-tight";
  const card = "rounded-2xl shadow-sm border bg-white p-5";
  const label = "text-sm font-medium text-slate-700";
  const input = "mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm";
  const small = "text-xs text-slate-500";

  const [form, setForm] = useState<FormState>(initialForm);
  const [saveStatus, setSaveStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<"form" | "saved">("form");
  const [searchTerm, setSearchTerm] = useState("");
  const [savedAssessments, setSavedAssessments] = useState<AssessmentRow[]>([]);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false);
  const [assessmentLoadError, setAssessmentLoadError] = useState("");
  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };
    const loadAssessments = async (term = "") => {
        try {
            setIsLoadingAssessments(true);
            setAssessmentLoadError("");

            let query = supabase
                .from("assessments")
                .select(`
        id,
        created_at,
        client_name,
        email,
        ghl_contact_id,
        assessment_date,
        coach,
        age,
        sex,
        goal,
        complaint,
        trx_squat,
        hip_hinge,
        trx_row,
        overhead_reach,
        ankle_left,
        ankle_right,
        aslr_left,
        aslr_right,
        floor_access,
        plank_movement,
        plank_time,
        farmer_carry,
        farmer_notes,
        sit_to_stand,
        sit_to_stand_status,
        grip_left,
        grip_right,
        balance_left,
        balance_right,
        top_limiting_factors,
        recommended_path,
        coach_notes,
        recommended_frequency,
        recommended_price,
        movement_total,
        movement_max,
        movement_pct,
        best_grip,
        best_balance,
        fsf_functional_strength_score,
        fsf_score_zone,
        fsf_score_label,
        fsf_score_interpretation,
        summary_text,
        recommendation_text,
        functional_age
      `)
                .order("created_at", { ascending: false });

            if (term.trim()) {
                query = query.ilike("client_name", `%${term.trim()}%`);
            }

            const { data, error } = await query;

            if (error) {
                console.error(error);
                setAssessmentLoadError("Could not load saved assessments.");
                return;
            }

            setSavedAssessments((data ?? []) as AssessmentRow[]);
        } catch (err) {
            console.error(err);
            setAssessmentLoadError("Could not load saved assessments.");
        } finally {
            setIsLoadingAssessments(false);
        }
    };

    const mapRowToForm = (row: AssessmentRow): FormState => {
        return {
            clientName: row.client_name ?? "",
            email: row.email ?? "",
            ghlContactId: row.ghl_contact_id ?? "",
            date: row.assessment_date ?? "",
            coach: row.coach ?? "",
            age: row.age !== null && row.age !== undefined ? String(row.age) : "",
            sex: row.sex ?? "",
            goal: row.goal ?? "",
            complaint: row.complaint ?? "",

            trxSquat: row.trx_squat !== null && row.trx_squat !== undefined ? String(row.trx_squat) : "",
            hipHinge: row.hip_hinge !== null && row.hip_hinge !== undefined ? String(row.hip_hinge) : "",
            trxRow: row.trx_row !== null && row.trx_row !== undefined ? String(row.trx_row) : "",
            overheadReach:
                row.overhead_reach !== null && row.overhead_reach !== undefined
                    ? String(row.overhead_reach)
                    : "",
            ankleLeft:
                row.ankle_left !== null && row.ankle_left !== undefined
                    ? String(row.ankle_left)
                    : "",
            ankleRight:
                row.ankle_right !== null && row.ankle_right !== undefined
                    ? String(row.ankle_right)
                    : "",
            aslrLeft:
                row.aslr_left !== null && row.aslr_left !== undefined
                    ? String(row.aslr_left)
                    : "",
            aslrRight:
                row.aslr_right !== null && row.aslr_right !== undefined
                    ? String(row.aslr_right)
                    : "",
            floorAccess: row.floor_access ?? "",
            plankMovement:
                row.plank_movement !== null && row.plank_movement !== undefined
                    ? String(row.plank_movement)
                    : "",

            plankTime:
                row.plank_time !== null && row.plank_time !== undefined
                    ? String(row.plank_time)
                    : "",
            farmerCarry:
                row.farmer_carry !== null && row.farmer_carry !== undefined
                    ? String(row.farmer_carry)
                    : "",
            farmerNotes: row.farmer_notes ?? "",
            sitToStand:
                row.sit_to_stand !== null && row.sit_to_stand !== undefined
                    ? String(row.sit_to_stand)
                    : "",
            sitToStandStatus: row.sit_to_stand_status ?? "",
            gripLeft:
                row.grip_left !== null && row.grip_left !== undefined
                    ? String(row.grip_left)
                    : "",
            gripRight:
                row.grip_right !== null && row.grip_right !== undefined
                    ? String(row.grip_right)
                    : "",
            balanceLeft:
                row.balance_left !== null && row.balance_left !== undefined
                    ? String(row.balance_left)
                    : "",
            balanceRight:
                row.balance_right !== null && row.balance_right !== undefined
                    ? String(row.balance_right)
                    : "",

            topLimitingFactors: row.top_limiting_factors ?? "",
            recommendedPath: row.recommended_path ?? "",
            recommendedFrequency: row.recommended_frequency ?? "",
            recommendedPrice: row.recommended_price ?? "",
            coachNotes: row.coach_notes ?? "",
        };
    };

    const handleLoadAssessment = (row: AssessmentRow) => {
        setForm(mapRowToForm(row));
        setSaveStatus("");
        setView("form");
    };

    useEffect(() => {
        if (view === "saved") {
            loadAssessments(searchTerm);
        }
    }, [view, searchTerm]);
    const formatListDate = (value: string | null) => {
        if (!value) return "No date";

        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toLocaleDateString();
        }

        return value;
    };
    const handleSaveAssessment = async () => {
        try {
            setIsSaving(true);
            setSaveStatus("");

            const payload = {
                client_name: form.clientName,
                email: form.email,
                ghl_contact_id: form.ghlContactId,
                assessment_date: form.date,
                coach: form.coach,
                age: form.age ? Number(form.age) : null,
                sex: form.sex,
                goal: form.goal,
                complaint: form.complaint,

                trx_squat: form.trxSquat ? Number(form.trxSquat) : null,
                hip_hinge: form.hipHinge ? Number(form.hipHinge) : null,
                trx_row: form.trxRow ? Number(form.trxRow) : null,
                overhead_reach: form.overheadReach ? Number(form.overheadReach) : null,
                ankle_left: form.ankleLeft ? Number(form.ankleLeft) : null,
                ankle_right: form.ankleRight ? Number(form.ankleRight) : null,
                aslr_left: form.aslrLeft ? Number(form.aslrLeft) : null,
                aslr_right: form.aslrRight ? Number(form.aslrRight) : null,
                floor_access: form.floorAccess,
                plank_movement: form.plankMovement ? Number(form.plankMovement) : null,

                plank_time: form.plankTime ? Number(form.plankTime) : null,
                farmer_carry: form.farmerCarry ? Number(form.farmerCarry) : null,
                farmer_notes: form.farmerNotes,
                sit_to_stand: form.sitToStand ? Number(form.sitToStand) : null,
                sit_to_stand_status: form.sitToStandStatus,
                grip_left: form.gripLeft ? Number(form.gripLeft) : null,
                grip_right: form.gripRight ? Number(form.gripRight) : null,
                balance_left: form.balanceLeft ? Number(form.balanceLeft) : null,
                balance_right: form.balanceRight ? Number(form.balanceRight) : null,

                top_limiting_factors: form.topLimitingFactors,
                recommended_path: form.recommendedPath || results.autoPath,
                recommended_frequency: form.recommendedFrequency,
                recommended_price: form.recommendedPrice,
                coach_notes: form.coachNotes,

                movement_total: results.movementTotal,
                movement_max: results.movementMax,
                movement_pct: results.movementPct,
                best_grip: results.bestGrip,
                best_balance: results.bestBalance,
                fsf_functional_strength_score: results.fsfFunctionalStrengthScore,
                fsf_score_zone: results.fsfScoreZone,
                fsf_score_label: results.fsfScoreLabel,
                fsf_score_interpretation: results.fsfScoreInterpretation,
                summary_text: results.summaryText,
                recommendation_text: results.recommendationText,
                functional_age: results.functionalAge,
            };

            const { error } = await supabase.from("assessments").insert(payload);

            if (error) {
                console.error(error);
                setSaveStatus("Could not save assessment.");
                return;
            }

            setSaveStatus("Assessment saved.");
        } catch (err) {
            console.error(err);
            setSaveStatus("Could not save assessment.");
        } finally {
            setIsSaving(false);
        }
    };

  const results = useMemo(() => {
    const num = (v: string) => {
      const n = parseFloat(v);
      return Number.isNaN(n) ? null : n;
    };

    const movementKeys: (keyof FormState)[] = [
      "trxSquat",
      "hipHinge",
      "trxRow",
      "overheadReach",
      "ankleLeft",
      "ankleRight",
      "aslrLeft",
      "aslrRight",
      "plankMovement",
    ];

    const movementValues = movementKeys
      .map((k) => num(form[k]))
      .filter((v): v is number => v !== null);
    const movementTotal = movementValues.reduce((sum, v) => sum + v, 0);
    const movementMax = movementKeys.length * 2;
    const movementPct = movementValues.length ? (movementTotal / movementMax) * 100 : 0;

    const squatPass = num(form.trxSquat) === 2;

    const sitToStand =
      squatPass && form.sitToStandStatus !== "Not tested - squat did not pass"
        ? num(form.sitToStand)
        : null;
    const sitToStandZone = sitToStand === null ? "gray" : getZone(sitToStand, 9, 15);

    const gripLeft = num(form.gripLeft);
    const gripRight = num(form.gripRight);
    const bestGrip = [gripLeft, gripRight].filter((v): v is number => v !== null).length
      ? Math.max(...[gripLeft, gripRight].filter((v): v is number => v !== null))
      : null;
    const gripZone = getSexSpecificGripZone(bestGrip, form.sex);

    const balanceLeft = num(form.balanceLeft);
    const balanceRight = num(form.balanceRight);
    const bestBalance = [balanceLeft, balanceRight].filter((v): v is number => v !== null).length
      ? Math.max(...[balanceLeft, balanceRight].filter((v): v is number => v !== null))
      : null;
    const balanceZone = bestBalance === null ? "gray" : getZone(bestBalance, 9.99, 20);

    const plankTime = num(form.plankTime);
    const plankZone = plankTime === null ? "gray" : getZone(plankTime, 14.99, 30);

    const floorAccessZone: Zone =
      form.floorAccess === "Cannot get on or off floor" ||
      form.floorAccess === "Can do one but not both"
        ? "red"
        : form.floorAccess === "Needs assistance"
          ? "yellow"
          : form.floorAccess === "Can get on and off floor independently"
            ? "green"
            : "gray";

    const scoredZones = [sitToStandZone, gripZone, balanceZone, plankZone, floorAccessZone].filter(
      (z): z is Exclude<Zone, "gray"> => z !== "gray",
    );
    const zonePoints = scoredZones.map((z) => (z === "green" ? 2 : z === "yellow" ? 1 : 0));
    const performanceAverage = zonePoints.length
      ? zonePoints.reduce<number>((a, b) => a + b, 0) / zonePoints.length
      : 0;

    let overallZone: Zone = "gray";
    if (performanceAverage >= 1.5 && movementPct >= 70) overallZone = "green";
    else if (performanceAverage >= 0.75 || movementPct >= 45) overallZone = "yellow";
    else if (zonePoints.length || movementValues.length) overallZone = "red";

    const movementScore100 = Math.round((movementTotal / movementMax) * 40);
    const sitScore100 =
      sitToStand === null
        ? null
        : Math.max(0, Math.min(20, Math.round((Math.min(sitToStand, 20) / 20) * 20)));
    const gripScore100 =
      bestGrip === null
        ? null
        : Math.max(
            0,
            Math.min(
              20,
              Math.round(
                (Math.min(bestGrip, form.sex === "Female" ? 80 : 120) /
                  (form.sex === "Female" ? 80 : 120)) *
                  20,
              ),
            ),
          );
    const balanceScore100 =
      bestBalance === null
        ? null
        : Math.max(0, Math.min(10, Math.round((Math.min(bestBalance, 30) / 30) * 10)));
    const plankScore100 =
      plankTime === null
        ? null
        : Math.max(0, Math.min(5, Math.round((Math.min(plankTime, 45) / 45) * 5)));
    const floorScore100 =
      form.floorAccess === "Can get on and off floor independently"
        ? 5
        : form.floorAccess === "Needs assistance"
          ? 3
          : form.floorAccess === "Can do one but not both"
            ? 1
            : form.floorAccess === "Cannot get on or off floor"
              ? 0
              : null;

    const fsfFunctionalStrengthScore = [
      movementScore100,
      sitScore100,
      gripScore100,
      balanceScore100,
      plankScore100,
      floorScore100,
    ]
      .filter((v): v is number => v !== null)
      .reduce((a, b) => a + b, 0);

    const fsfScoreZone: Zone =
      fsfFunctionalStrengthScore >= 80
        ? "green"
        : fsfFunctionalStrengthScore >= 55
          ? "yellow"
          : fsfFunctionalStrengthScore > 0
            ? "red"
            : "gray";

    const fsfScoreLabel =
      fsfFunctionalStrengthScore >= 80
        ? "Strong Aging"
        : fsfFunctionalStrengthScore >= 55
          ? "Functional Strength"
          : fsfFunctionalStrengthScore > 0
            ? "Build the Foundation"
            : "Not scored";

    const fsfScoreInterpretation =
      fsfFunctionalStrengthScore >= 80
        ? "You currently demonstrate the kind of strength, balance, and movement capacity that supports healthy, independent aging. The goal now is to maintain and build on this foundation so you stay strong for life."
        : fsfFunctionalStrengthScore >= 55
          ? "You have a workable base of strength and function, but there are a few areas that need attention now to improve resilience, confidence, and long-term independence."
          : fsfFunctionalStrengthScore > 0
            ? "Your assessment shows that the first priority is building a stronger foundation. Improving these basics now can greatly improve confidence, safety, and quality of life later."
            : "Complete the assessment to generate your FSF Functional Strength Score.";

    const autoPath =
      overallZone === "green"
        ? "Green Path - Ready to train"
        : overallZone === "yellow"
          ? "Yellow Path - Movement prep + strength"
          : overallZone === "red"
            ? "Red Path - Corrective entry point"
            : "";

    const summaryText =
      overallZone === "green"
        ? "Your assessment shows a strong movement and strength foundation."
        : overallZone === "yellow"
          ? "Your assessment shows early signs of strength, balance, or mobility decline that commonly appear as we age."
          : overallZone === "red"
            ? "Your assessment shows several areas where strength, balance, or mobility are below the levels typically seen in adults who remain independent later in life."
            : "Complete the assessment to generate a personalized report.";

    const recommendationText =
      overallZone === "green"
        ? "Continue structured strength training to maintain and build muscle, balance, and resilience."
        : overallZone === "yellow"
          ? "Begin a structured strength training program 2–3 times per week focused on lower body strength, balance, grip strength, and core stability."
          : overallZone === "red"
            ? "Start with a guided entry-level strength program focused on restoring confidence, improving balance, rebuilding foundational strength, and safely improving floor mobility."
            : "";

    const ageNum = parseFloat(form.age);
    const functionalAge =
      !Number.isNaN(ageNum) && fsfFunctionalStrengthScore > 0
        ? Math.round(ageNum + (70 - fsfFunctionalStrengthScore) / 3)
        : null;

    return {
      movementTotal,
      movementMax,
      movementPct,
      squatPass,
      sitToStand,
      sitToStandZone,
      bestGrip,
      gripZone,
      bestBalance,
      balanceZone,
      plankTime,
      plankZone,
      floorAccessZone,
      overallZone,
      fsfFunctionalStrengthScore,
      fsfScoreZone,
      fsfScoreLabel,
      fsfScoreInterpretation,
      autoPath,
      summaryText,
      recommendationText,
      functionalAge,
    };
  }, [form]);

  const previewMetrics: MetricCard[] = [
    {
      title: "Lower Body Strength",
      value:
        results.sitToStand !== null
          ? `${results.sitToStand} sit-to-stands`
          : "Not scored yet",
      target: "Healthy target: 16+",
      zone: results.sitToStandZone,
      why: "Lower body strength is one of the strongest predictors of independence as we age. It affects climbing stairs, getting out of chairs, and reducing fall risk.",
      numericValue: results.sitToStand,
      maxValue: 20,
    },
    {
      title: "Grip Strength",
      value: results.bestGrip !== null ? `${results.bestGrip} lb` : "Not scored yet",
      target: form.sex === "Female" ? "Healthy target: 65+ lb" : "Healthy target: 95+ lb",
      zone: results.gripZone,
      why: "Grip strength is strongly linked to overall strength and longevity. It reflects total body muscle health and resilience.",
      numericValue: results.bestGrip,
      maxValue: 120,
    },
    {
      title: "Balance",
      value: results.bestBalance !== null ? `${results.bestBalance} sec` : "Not scored yet",
      target: "Healthy target: 20+ sec",
      zone: results.balanceZone,
      why: "Balance ability is a major factor in preventing falls. Improving balance helps maintain confidence and independence.",
      numericValue: results.bestBalance,
      maxValue: 40,
    },
    {
      title: "Core Stability",
      value: results.plankTime !== null ? `${results.plankTime} sec` : "Not scored yet",
      target: "Healthy target: 30+ sec",
      zone: results.plankZone,
      why: "Core stability protects the spine and allows safe lifting, bending, and everyday movement.",
      numericValue: results.plankTime,
      maxValue: 45,
    },
    {
      title: "Floor Access",
      value: form.floorAccess || "Not scored yet",
      target: "Healthy target: independent on/off floor",
      zone: results.floorAccessZone,
      why: "Being able to safely get on and off the floor is a key indicator of functional independence later in life.",
      numericValue: null,
      maxValue: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-red-700 to-slate-900 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-red-100">
                Freedom Strength &amp; Fitness
              </p>
              <h1 className="text-3xl font-black">Functional Strength Assessment</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-200">
                Coach-facing digital assessment for adults 50+ with client-ready
                results, healthy aging benchmarks, and printable take-home report.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-sm backdrop-blur">
              <div>Assessment Length: 8–10 min</div>
              <div>
                Primary Goal: convert movement findings into clear training need
              </div>
            </div>
          </div>
        </header>
              <div className="flex flex-wrap gap-3">
                  <button
                      type="button"
                      onClick={() => setView("form")}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold ${view === "form"
                              ? "bg-slate-900 text-white"
                              : "border bg-white text-slate-800 hover:bg-slate-50"
                          }`}
                  >
                      Assessment
                  </button>

                  <button
                      type="button"
                      onClick={() => setView("saved")}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold ${view === "saved"
                              ? "bg-slate-900 text-white"
                              : "border bg-white text-slate-800 hover:bg-slate-50"
                          }`}
                  >
                      Saved Assessments
                  </button>
              </div>
              {view === "form" ? (
                  <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <main className="space-y-6">
            <section className={card}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={sectionTitle}>1. Client Info</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Start Here
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <ClientPicker
                    value={form.clientName}
                    email={form.email}
                    onSelect={(c) => {
                      if (c) {
                        setField("clientName", c.name);
                        setField("email", c.email);
                        setField("ghlContactId", c.ghlContactId);
                      } else {
                        setField("clientName", "");
                        setField("email", "");
                        setField("ghlContactId", "");
                      }
                    }}
                    onNameChange={(name) => setField("clientName", name)}
                    inputClassName={input}
                    labelClassName={label}
                  />
                </div>
                <div>
                  <label className={label}>Date</label>
                  <input
                    className={input}
                    value={form.date}
                    onChange={(e) => setField("date", e.target.value)}
                    placeholder="MM/DD/YYYY"
                  />
                </div>
                <div>
                  <label className={label}>Coach</label>
                  <input
                    className={input}
                    value={form.coach}
                    onChange={(e) => setField("coach", e.target.value)}
                  />
                </div>
                <div>
                  <label className={label}>Age</label>
                  <input
                    className={input}
                    value={form.age}
                    onChange={(e) => setField("age", e.target.value)}
                  />
                </div>
                <div>
                  <label className={label}>Sex</label>
                  <select
                    className={input}
                    value={form.sex}
                    onChange={(e) => setField("sex", e.target.value)}
                  >
                    <option>Female</option>
                    <option>Male</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className={label}>Primary Goal</label>
                  <input
                    className={input}
                    value={form.goal}
                    onChange={(e) => setField("goal", e.target.value)}
                  />
                </div>
                <div>
                  <label className={label}>Primary Limitation / Complaint</label>
                  <input
                    className={input}
                    value={form.complaint}
                    onChange={(e) => setField("complaint", e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className={card}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className={sectionTitle}>2. Movement Screen</h2>
                  <p className={small}>
                    Scoring: 2 = clean, 1 = compensation, 0 = pain/unable
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  Movement Score: {results.movementTotal}/{results.movementMax}
                </div>
              </div>

              <div className="space-y-4">
                {([
                  ["trxSquat", "TRX Assisted Squat", "Global squat pattern"],
                  ["hipHinge", "Hip Hinge (Wall Tap)", "Posterior chain pattern"],
                  ["trxRow", "TRX Row", "Upper back + scapular control"],
                  [
                    "overheadReach",
                    "Overhead Reach",
                    "Shoulder + T-spine mobility",
                  ],
                ] as const).map(([key, title, desc]) => (
                  <div key={key} className="rounded-2xl border p-4">
                    <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr] md:items-end">
                      <div>
                        <div className="font-semibold text-slate-900">{title}</div>
                        <div className={small}>{desc}</div>
                      </div>
                      <div>
                        <label className={label}>Score</label>
                        <select
                          className={input}
                          value={form[key]}
                          onChange={(e) => setField(key, e.target.value)}
                        >
                          <option value="">Select score</option>
                          {movementOptions
                            .filter((opt) => opt.value !== "")
                            .map((opt) => (
                              <option key={`${key}-${opt.value}`} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="rounded-2xl border p-4">
                  <div className="font-semibold text-slate-900">
                    Ankle Dorsiflexion (Knee-to-Wall)
                  </div>
                  <div className={small}>
                    Goal: ~4 inches from wall with heel down
                  </div>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={label}>Left</label>
                      <select
                        className={input}
                        value={form.ankleLeft}
                        onChange={(e) => setField("ankleLeft", e.target.value)}
                      >
                        <option value="">Select score</option>
                        {movementOptions
                          .filter((opt) => opt.value !== "")
                          .map((opt) => (
                            <option key={`ankle-left-${opt.value}`} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className={label}>Right</label>
                      <select
                        className={input}
                        value={form.ankleRight}
                        onChange={(e) => setField("ankleRight", e.target.value)}
                      >
                        <option value="">Select score</option>
                        {movementOptions
                          .filter((opt) => opt.value !== "")
                          .map((opt) => (
                            <option
                              key={`ankle-right-${opt.value}`}
                              value={opt.value}
                            >
                              {opt.label}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="font-semibold text-slate-900">
                    Active Straight Leg Raise
                  </div>
                  <div className={small}>
                    Add floor access ability to capture real-world function
                  </div>
                  <div className="mt-3 grid gap-4 lg:grid-cols-3">
                    <div>
                      <label className={label}>Left</label>
                      <select
                        className={input}
                        value={form.aslrLeft}
                        onChange={(e) => setField("aslrLeft", e.target.value)}
                      >
                        <option value="">Select score</option>
                        {movementOptions
                          .filter((opt) => opt.value !== "")
                          .map((opt) => (
                            <option key={`aslr-left-${opt.value}`} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className={label}>Right</label>
                      <select
                        className={input}
                        value={form.aslrRight}
                        onChange={(e) => setField("aslrRight", e.target.value)}
                      >
                        <option value="">Select score</option>
                        {movementOptions
                          .filter((opt) => opt.value !== "")
                          .map((opt) => (
                            <option key={`aslr-right-${opt.value}`} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className={label}>Floor Access</label>
                      <select
                        className={input}
                        value={form.floorAccess}
                        onChange={(e) => setField("floorAccess", e.target.value)}
                      >
                        <option value="">Select status</option>
                        {floorOptions
                          .filter((opt) => opt !== "")
                          .map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="font-semibold text-slate-900">Front Plank</div>
                  <div className={small}>
                    Movement quality score plus measurable plank time
                  </div>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={label}>Movement Score</label>
                      <select
                        className={input}
                        value={form.plankMovement}
                        onChange={(e) => setField("plankMovement", e.target.value)}
                      >
                        <option value="">Select score</option>
                        {movementOptions
                          .filter((opt) => opt.value !== "")
                          .map((opt) => (
                            <option key={`plank-${opt.value}`} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className={label}>Hold Time (seconds)</label>
                      <input
                        className={input}
                        value={form.plankTime}
                        onChange={(e) => setField("plankTime", e.target.value)}
                        placeholder="0–30"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed p-4">
                  <div className="font-semibold text-slate-900">
                    Optional Farmer Carry
                  </div>
                  <div className={small}>
                    Useful later for real-world strength and gait capacity
                  </div>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={label}>Score</label>
                      <select
                        className={input}
                        value={form.farmerCarry}
                        onChange={(e) => setField("farmerCarry", e.target.value)}
                      >
                        <option value="">Select score</option>
                        {movementOptions
                          .filter((opt) => opt.value !== "")
                          .map((opt) => (
                            <option key={`farmer-${opt.value}`} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className={label}>Notes</label>
                      <input
                        className={input}
                        value={form.farmerNotes}
                        onChange={(e) => setField("farmerNotes", e.target.value)}
                        placeholder="Lean, short steps, grip fatigue..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={card}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className={sectionTitle}>3. Functional Metrics</h2>
                  <p className={small}>
                    Objective benchmarks tied to healthy aging and independence
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Measurable
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">30-Second Sit-to-Stand</div>
                      <div className={small}>
                        Only perform if TRX squat passes safely
                      </div>
                    </div>
                    <ScoreBadge zone={results.sitToStandZone} />
                  </div>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={label}>Reps Completed</label>
                      <input
                        className={input}
                        value={form.sitToStand}
                        onChange={(e) => setField("sitToStand", e.target.value)}
                        placeholder="e.g. 8"
                        disabled={!results.squatPass}
                      />
                    </div>
                    <div>
                      <label className={label}>Status</label>
                      <select
                        className={input}
                        value={form.sitToStandStatus}
                        onChange={(e) =>
                          setField("sitToStandStatus", e.target.value)
                        }
                      >
                        <option value="">Select status</option>
                        <option>Completed</option>
                        <option>Not tested - squat did not pass</option>
                      </select>
                    </div>
                  </div>
                  <ZoneMeter
                    value={results.sitToStand}
                    min={0}
                    max={20}
                    labels={["Risk: <10", "Functional: 10–15", "Strong: 16+"]}
                  />
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">Grip Strength</div>
                      <div className={small}>
                        Use hand dynamometer; capture best side or both sides
                      </div>
                    </div>
                    <ScoreBadge zone={results.gripZone} />
                  </div>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={label}>Left Grip (lb)</label>
                      <input
                        className={input}
                        value={form.gripLeft}
                        onChange={(e) => setField("gripLeft", e.target.value)}
                        placeholder="e.g. 42"
                      />
                    </div>
                    <div>
                      <label className={label}>Right Grip (lb)</label>
                      <input
                        className={input}
                        value={form.gripRight}
                        onChange={(e) => setField("gripRight", e.target.value)}
                        placeholder="e.g. 47"
                      />
                    </div>
                  </div>
                  <ZoneMeter
                    value={results.bestGrip}
                    min={0}
                    max={120}
                    labels={[
                      form.sex === "Female" ? "Risk: <40" : "Risk: <65",
                      form.sex === "Female"
                        ? "Functional: 40–64"
                        : "Functional: 65–94",
                      form.sex === "Female" ? "Strong: 65+" : "Strong: 95+",
                    ]}
                  />
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">Single-Leg Balance</div>
                      <div className={small}>Track best side and weaker side</div>
                    </div>
                    <ScoreBadge zone={results.balanceZone} />
                  </div>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={label}>Left (sec)</label>
                      <input
                        className={input}
                        value={form.balanceLeft}
                        onChange={(e) => setField("balanceLeft", e.target.value)}
                        placeholder="e.g. 6"
                      />
                    </div>
                    <div>
                      <label className={label}>Right (sec)</label>
                      <input
                        className={input}
                        value={form.balanceRight}
                        onChange={(e) =>
                          setField("balanceRight", e.target.value)
                        }
                        placeholder="e.g. 11"
                      />
                    </div>
                  </div>
                  <ZoneMeter
                    value={results.bestBalance}
                    min={0}
                    max={40}
                    labels={[
                      "Risk: <10 sec",
                      "Functional: 10–20 sec",
                      "Strong: 20+ sec",
                    ]}
                  />
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">
                        Core Stability Benchmark
                      </div>
                      <div className={small}>
                        Use plank hold time for client-friendly benchmark
                      </div>
                    </div>
                    <ScoreBadge zone={results.plankZone} />
                  </div>
                  <div className="mt-3">
                    <label className={label}>Plank Hold (sec)</label>
                    <input
                      className={input}
                      value={form.plankTime}
                      onChange={(e) => setField("plankTime", e.target.value)}
                      placeholder="e.g. 18"
                    />
                  </div>
                  <ZoneMeter
                    value={results.plankTime}
                    min={0}
                    max={45}
                    labels={[
                      "Risk: <15 sec",
                      "Functional: 15–30 sec",
                      "Strong: 30+ sec",
                    ]}
                  />
                </div>
              </div>
            </section>

            <section className={card}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className={sectionTitle}>4. Findings + Path</h2>
                  <p className={small}>
                    Summarize limiting factors and choose the right starting point
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Coach Summary
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={label}>Top Limiting Factors</label>
                  <textarea
                    className={`${input} min-h-24`}
                    value={form.topLimitingFactors}
                    onChange={(e) =>
                      setField("topLimitingFactors", e.target.value)
                    }
                  />
                                  </div>
                                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                                      <div>
                                          <label className={label}>Recommended Training Frequency</label>
                                          <select
                                              className={input}
                                              value={form.recommendedFrequency}
                                              onChange={(e) => {
                                                  const value = e.target.value;
                                                  setField("recommendedFrequency", value);

                                                  if (value === "2x per week") {
                                                      setField("recommendedPrice", "$179 bi-weekly");
                                                  } else if (value === "3x per week") {
                                                      setField("recommendedPrice", "$268 bi-weekly");
                                                  } else if (value === "1x per week") {
                                                      setField("recommendedPrice", "$131 bi-weekly");
                                                  }
                                              }}
                                          >
                                              <option value="">Select frequency</option>
                                              <option value="1x per week">1x per week</option>
                                              <option value="2x per week">2x per week</option>
                                              <option value="3x per week">3x per week</option>
                                          </select>
                                      </div>

                                      <div>
                                          <label className={label}>Recommended Price</label>
                                          <input
                                              className={input}
                                              value={form.recommendedPrice}
                                              onChange={(e) => setField("recommendedPrice", e.target.value)}
                                              placeholder="$170 bi-weekly"
                                          />
                                      </div>
                                  </div>
                <div>
                  <label className={label}>Recommended Path</label>
                  <select
                    className={input}
                    value={form.recommendedPath || results.autoPath}
                    onChange={(e) => setField("recommendedPath", e.target.value)}
                  >
                    <option value="">Select path</option>
                    {pathOptions
                      .filter((opt) => opt !== "")
                      .map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                  </select>
                  <label className={`${label} mt-4 block`}>Coach Notes</label>
                  <textarea
                    className={`${input} min-h-24`}
                    value={form.coachNotes}
                    onChange={(e) => setField("coachNotes", e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button className="rounded-2xl bg-red-700 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-red-800">
                  Generate Assessment Report
                </button>
                <button
                  className="rounded-2xl border bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  onClick={handleSaveAssessment}
                  disabled={isSaving}
                 >
                 {isSaving ? "Saving..." : "Save Assessment"}
                              </button>
                              {saveStatus && (
                                  <p className="mt-3 text-sm text-slate-600">{saveStatus}</p>
                              )}
                <button
                  className="rounded-2xl border bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  onClick={() => setForm(initialForm)}
                >
                  Reset
                </button>
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <section className={`${card} sticky top-6`}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className={sectionTitle}>Live Client Report Preview</h2>
                  <p className={small}>This is the shareable / printable result view</p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${zoneClasses(
                    results.overallZone,
                  )}`}
                >
                  {zoneText(results.overallZone)} Zone
                </span>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  FSF Functional Strength Score
                </div>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <div className={`text-4xl font-black ${toneClass(results.fsfScoreZone)}`}>
                    {results.fsfFunctionalStrengthScore || 0}
                    <span className="text-lg font-bold text-slate-500">/100</span>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${zoneClasses(
                      results.fsfScoreZone,
                    )}`}
                  >
                    {results.fsfScoreLabel}
                  </span>
                </div>
                <div className="mt-3">
                  <ZoneMeter
                    value={results.fsfFunctionalStrengthScore || null}
                    min={0}
                    max={100}
                    labels={[
                      "Build the Foundation",
                      "Functional Strength",
                      "Strong Aging",
                    ]}
                  />
                </div>
                <p className="mt-3 text-sm text-slate-700">
                  {results.fsfScoreInterpretation}
                </p>
              </div>

              <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Overall Status
                </div>
                <div className={`mt-1 text-2xl font-black ${toneClass(results.overallZone)}`}>
                  {zoneText(results.overallZone)} Zone
                </div>
                <p className="mt-2 text-sm text-slate-700">{results.summaryText}</p>
              </div>

              <div className="mt-4 rounded-2xl border bg-white p-4">
                <div className="grid gap-3 text-sm text-slate-700">
                  <div>
                    <span className="font-semibold">Client:</span>{" "}
                    {form.clientName || "—"}
                  </div>
                  <div>
                    <span className="font-semibold">Age:</span> {form.age || "—"}
                  </div>
                  <div>
                    <span className="font-semibold">Coach:</span>{" "}
                    {form.coach || "—"}
                  </div>
                  <div>
                    <span className="font-semibold">Primary Goal:</span>{" "}
                    {form.goal || "—"}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {previewMetrics.map((metric) => (
                  <div key={metric.title} className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {metric.title}
                        </div>
                        <div className="text-sm text-slate-700">
                          Your score: {metric.value}
                        </div>
                        <div className="text-xs text-slate-500">{metric.target}</div>
                        <div className="mt-2 text-xs text-slate-600">{metric.why}</div>
                      </div>
                      <ScoreBadge zone={metric.zone} />
                    </div>
                    {metric.numericValue !== null && (
                      <div className="mt-3">
                        <ZoneMeter
                          value={metric.numericValue}
                          min={0}
                          max={metric.maxValue}
                          labels={["Risk", "Functional", "Strong"]}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border p-4">
                <div className="font-semibold text-slate-900">Top Limiting Factors</div>
                <p className="mt-1 text-sm text-slate-700">
                  {form.topLimitingFactors ||
                    "Complete assessment to show limiting factors."}
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
                <div className="font-semibold text-green-900">
                  Recommended Next Step
                </div>
                <p className="mt-1 text-sm text-green-800">
                  {results.recommendationText}
                </p>
                <p className="mt-2 text-xs text-green-700">
                  Most clients can improve these scores significantly in 8–12 weeks
                  with structured training.
                </p>
              </div>

              <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
                <div className="font-semibold text-slate-900">Coach Plan</div>
                <div className="mt-1 text-sm text-slate-700">
                  {form.recommendedPath ||
                    results.autoPath ||
                    "Assessment path will populate here."}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {form.coachNotes || "Coach notes will appear here."}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => window.print()}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Print PDF
                </button>

                <button
                  onClick={async () => {
                    try {
                      if (navigator.share) {
                        await navigator.share({
                          title: "FSF Functional Strength Assessment",
                          text: "Here are my results from my assessment at Freedom Strength & Fitness.",
                          url: window.location.href,
                        });
                      } else {
                        await navigator.clipboard.writeText(window.location.href);
                        alert(
                          "Share is not supported on this device. The link has been copied instead.",
                        );
                      }
                    } catch (err) {
                      console.error("Share failed:", err);
                    }
                  }}
                  className="rounded-2xl border bg-white px-4 py-2 text-sm font-semibold text-slate-800"
                >
                  Share Result
                </button>
              </div>
            </section>

            <section id="printReport" className={card}>
              <div className="border-b pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      Freedom Strength &amp; Fitness
                    </h2>
                    <p className="text-sm text-slate-600">
                      Functional Strength Assessment Report
                    </p>
                  </div>
                  <div className="text-right text-sm text-slate-700">
                    <div>Client: {form.clientName || "—"}</div>
                    <div>Age: {form.age || "—"}</div>
                    <div>Date: {form.date || "—"}</div>
                    <div>Coach: {form.coach || "—"}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    FSF Functional Strength Score
                  </div>
                  <div className={`text-4xl font-black ${toneClass(results.fsfScoreZone)}`}>
                    {results.fsfFunctionalStrengthScore || 0}/100
                  </div>
                  <div className="mt-1 text-sm font-semibold">
                    {results.fsfScoreLabel}
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    {results.fsfScoreInterpretation}
                  </p>
                </div>
                <div>
                  <ZoneMeter
                    value={results.fsfFunctionalStrengthScore || null}
                    min={0}
                    max={100}
                    labels={[
                      "Build the Foundation",
                      "Functional Strength",
                      "Strong Aging",
                    ]}
                  />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Key Functional Metrics
                </h3>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {previewMetrics.map((metric) => (
                    <div
                      key={`print-${metric.title}`}
                      className="rounded-xl border p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold">{metric.title}</div>
                        <ScoreBadge zone={metric.zone} />
                      </div>
                      <div className="text-sm text-slate-700">
                        Score: {metric.value}
                      </div>
                      <div className="text-xs text-slate-500">{metric.target}</div>
                      <p className="mt-1 text-xs text-slate-600">{metric.why}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-xl border bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Recommended Training Path
                </div>
                <p className="mt-1 text-sm text-slate-700">
                  {results.recommendationText}
                </p>
              </div>
                              <div className="mt-6 rounded-xl border bg-white p-4">
                                  <div className="text-xs uppercase tracking-wide text-slate-500">
                                      Coach's Recommendation
                                  </div>

                                  <div className="mt-3 space-y-3 text-sm text-slate-800">
                                      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                                          <div className="flex items-center gap-3">
                                              <span className="inline-flex h-5 w-5 items-center justify-center rounded border text-xs font-bold">
                                                  {form.recommendedFrequency === "1x per week" ? "✓" : ""}
                                              </span>
                                              <span>1x per week</span>
                                          </div>
                                          <span>$131 bi-weekly</span>
                                      </div>

                                      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                                          <div className="flex items-center gap-3">
                                              <span className="inline-flex h-5 w-5 items-center justify-center rounded border text-xs font-bold">
                                                  {form.recommendedFrequency === "2x per week" ? "✓" : ""}
                                              </span>
                                              <span>2x per week</span>
                                          </div>
                                          <span>$179 bi-weekly</span>
                                      </div>

                                      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                                          <div className="flex items-center gap-3">
                                              <span className="inline-flex h-5 w-5 items-center justify-center rounded border text-xs font-bold">
                                                  {form.recommendedFrequency === "3x per week" ? "✓" : ""}
                                              </span>
                                              <span>3x per week</span>
                                          </div>
                                          <span>$268 bi-weekly</span>
                                      </div>
                                  </div>

                                  {form.recommendedPrice && (
                                      <div className="mt-4 text-sm text-slate-700">
                                          <span className="font-semibold">Recommended Price:</span> {form.recommendedPrice}
                                      </div>
                                  )}
                              </div>
                              <div className="mt-3 text-xs text-slate-500">
                                  Based on your current assessment, this is the coaching frequency most likely to help you improve safely and consistently over the next 8–12 weeks.
                              </div>
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Progress Tracking
                </h3>
                <p className="text-xs text-slate-500">
                  Save assessments over time to track improvement.
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl border p-3">
                    <div className="text-xs text-slate-500">Initial Score</div>
                    <div className="text-lg font-bold">
                      {results.fsfFunctionalStrengthScore || "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border p-3">
                    <div className="text-xs text-slate-500">8–12 Week Goal</div>
                    <div className="text-lg font-bold">
                      {results.fsfFunctionalStrengthScore
                        ? Math.min(100, results.fsfFunctionalStrengthScore + 15)
                        : "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border p-3">
                    <div className="text-xs text-slate-500">Long-Term Target</div>
                    <div className="text-lg font-bold">80+</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Functional Strength Age
                </div>
                {results.functionalAge !== null ? (
                  <div className="mt-2">
                    <div className="text-sm">
                      Chronological Age:{" "}
                      <span className="font-semibold">{form.age}</span>
                    </div>
                    <div className="text-lg font-bold">
                      Functional Strength Age: {results.functionalAge}
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      This estimate reflects how your strength, balance, and
                      mobility compare to typical aging benchmarks. Improving
                      strength can lower this number.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Complete the assessment to calculate functional age.
                  </p>
                )}
              </div>
                                <div className="mt-6 text-xs text-slate-500">
                                    Freedom Strength &amp; Fitness — Helping adults build strength,
                                    resilience, and confidence for life.
                                </div>
                            </section>
                        </aside>
                    </div>
                ) : (
                    <section className="rounded-3xl border bg-white p-5 shadow-sm">
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Saved Assessments
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Search by client name and tap a record to reopen it.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setView("form")}
                                className="rounded-2xl border bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                            >
                                Back to Assessment
                            </button>
                        </div>

                        <div className="mb-5 flex flex-col gap-3 md:flex-row">
                            <input
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by client name"
                            />
                            <button
                                type="button"
                                onClick={() => loadAssessments(searchTerm)}
                                className="rounded-2xl bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800"
                            >
                                Search
                            </button>
                        </div>

                        {isLoadingAssessments && (
                            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                Loading assessments...
                            </div>
                        )}

                        {!!assessmentLoadError && (
                            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                                {assessmentLoadError}
                            </div>
                        )}

                        {!isLoadingAssessments && !assessmentLoadError && savedAssessments.length === 0 && (
                            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                No assessments found.
                            </div>
                        )}

                        {!isLoadingAssessments && !assessmentLoadError && savedAssessments.length > 0 && (
                            <div className="space-y-3">
                                {savedAssessments.map((row) => (
                                    <button
                                        key={row.id}
                                        type="button"
                                        onClick={() => handleLoadAssessment(row)}
                                        className="w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                                    >
                                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <div className="text-lg font-semibold text-slate-900">
                                                    {row.client_name || "Unnamed Client"}
                                                </div>
                                                <div className="text-sm text-slate-500">
                                                    {formatListDate(row.assessment_date || row.created_at)}
                                                    {row.coach ? ` • Coach: ${row.coach}` : ""}
                                                </div>
                                            </div>

                                            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">
                                                Score: {row.fsf_functional_strength_score ?? "--"}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}