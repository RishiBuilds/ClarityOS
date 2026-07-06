const commonPatterns = [
  { regex: /\butilize\b/gi, replacement: "use" },
  { regex: /\butilizing\b/gi, replacement: "using" },
  { regex: /\butilization\b/gi, replacement: "use" },
  { regex: /\bimplement\b/gi, replacement: "do" },
  { regex: /\bimplementation\b/gi, replacement: "doing" },
  { regex: /\bfacilitate\b/gi, replacement: "help" },
  { regex: /\bfacilitation\b/gi, replacement: "help" },
  { regex: /\bcommence\b/gi, replacement: "start" },
  { regex: /\bterminate\b/gi, replacement: "end" },
  { regex: /\btermination\b/gi, replacement: "end" },
  { regex: /\bsubsequent\b/gi, replacement: "next" },
  { regex: /\bsubsequently\b/gi, replacement: "then" },
  { regex: /\bdemonstrate\b/gi, replacement: "show" },
  { regex: /\bindicate\b/gi, replacement: "show" },
  { regex: /\bapproximately\b/gi, replacement: "about" },
  { regex: /\bsufficient\b/gi, replacement: "enough" },
  { regex: /\bregarding\b/gi, replacement: "about" },
  { regex: /\bin order to\b/gi, replacement: "to" },
  { regex: /\bfor the purpose of\b/gi, replacement: "to" },
  { regex: /\bin the event that\b/gi, replacement: "if" },
  { regex: /\bprior to\b/gi, replacement: "before" },
  { regex: /\bat this point in time\b/gi, replacement: "now" },
  { regex: /\bin the near future\b/gi, replacement: "soon" },
  { regex: /\bnevertheless\b/gi, replacement: "still" },
  { regex: /\bnotwithstanding\b/gi, replacement: "despite" },
  { regex: /\binasmuch as\b/gi, replacement: "because" },
  { regex: /\bascertain\b/gi, replacement: "find out" },
  { regex: /\bendeavor\b/gi, replacement: "try" },
  { regex: /\bprocure\b/gi, replacement: "get" },
  { regex: /\brelinquish\b/gi, replacement: "give up" },
  { regex: /\bsupersede\b/gi, replacement: "replace" },
  { regex: /\btransmit\b/gi, replacement: "send" },
  { regex: /\bmodify\b/gi, replacement: "change" },
  { regex: /\bmodification\b/gi, replacement: "change" },
  { regex: /\bnumerous\b/gi, replacement: "many" },
  { regex: /\bpossess\b/gi, replacement: "have" },
  { regex: /\bpurchase\b/gi, replacement: "buy" },
  { regex: /\brequire\b/gi, replacement: "need" },
  { regex: /\brequirement\b/gi, replacement: "need" },
  { regex: /\bsubstantial\b/gi, replacement: "large" },
  { regex: /\bconsequently\b/gi, replacement: "so" },
  { regex: /\bfurthermore\b/gi, replacement: "also" },
  { regex: /\badditionally\b/gi, replacement: "also" },
];

const grade6Patterns = [
  ...commonPatterns,

  { regex: /\bhypertension\b/gi, replacement: "high blood pressure" },
  { regex: /\badminister medication\b/gi, replacement: "give medicine" },
  { regex: /\badminister\b/gi, replacement: "give" },
  { regex: /\bmedication\b/gi, replacement: "medicine" },
  { regex: /\bprescription\b/gi, replacement: "medicine order" },
  { regex: /\bdiagnosis\b/gi, replacement: "what is wrong" },
  { regex: /\bdiagnosed\b/gi, replacement: "found" },
  { regex: /\bprognosis\b/gi, replacement: "outlook" },
  { regex: /\bsymptoms\b/gi, replacement: "signs" },
  { regex: /\bsymptom\b/gi, replacement: "sign" },
  { regex: /\balleviate\b/gi, replacement: "ease" },
  { regex: /\bameliorates?\b/gi, replacement: "helps" },
  { regex: /\bexacerbate\b/gi, replacement: "make worse" },
  { regex: /\bcontraindicated\b/gi, replacement: "should not be used" },
  { regex: /\badverse\b/gi, replacement: "bad" },
  { regex: /\befficacy\b/gi, replacement: "how well it works" },
  { regex: /\bcardiovascular\b/gi, replacement: "heart and blood vessel" },
  { regex: /\brespiratory\b/gi, replacement: "breathing" },
  { regex: /\bpulmonary\b/gi, replacement: "lung" },
  { regex: /\brenal\b/gi, replacement: "kidney" },
  { regex: /\bhepatic\b/gi, replacement: "liver" },
  { regex: /\bcognitive\b/gi, replacement: "thinking" },
  { regex: /\bneurological\b/gi, replacement: "brain and nerve" },
  { regex: /\bchronic\b/gi, replacement: "long-lasting" },
  { regex: /\bacute\b/gi, replacement: "sudden" },
  { regex: /\basymptomatic\b/gi, replacement: "without signs" },
  { regex: /\bbenign\b/gi, replacement: "not harmful" },
  { regex: /\bmalignant\b/gi, replacement: "harmful" },
  { regex: /\bpathology\b/gi, replacement: "disease study" },
  { regex: /\bphysician\b/gi, replacement: "doctor" },
  { regex: /\bconsultation\b/gi, replacement: "visit" },
  { regex: /\breferral\b/gi, replacement: "sending to another doctor" },
  { regex: /\bcompliance\b/gi, replacement: "following the plan" },
  { regex: /\bcontraindication\b/gi, replacement: "reason not to use" },
  { regex: /\bmanifest\b/gi, replacement: "show up" },
  { regex: /\bpresenting\b/gi, replacement: "showing" },

  { regex: /\bit is important to note that\b/gi, replacement: "note:" },
  { regex: /\bit should be noted that\b/gi, replacement: "note:" },
  { regex: /\bin light of the fact that\b/gi, replacement: "because" },
];

const grade8Patterns = [
  ...commonPatterns,

  { regex: /\bpursuant to\b/gi, replacement: "under" },
  { regex: /\bwhereas\b/gi, replacement: "since" },
  { regex: /\bhereinafter\b/gi, replacement: "from now on" },
  { regex: /\bhereby\b/gi, replacement: "by this" },
  { regex: /\bherein\b/gi, replacement: "in this" },
  { regex: /\bthereof\b/gi, replacement: "of that" },
  { regex: /\btherein\b/gi, replacement: "in that" },
  { regex: /\baforesaid\b/gi, replacement: "said before" },
  { regex: /\bwhereupon\b/gi, replacement: "after which" },
  { regex: /\ballocate\b/gi, replacement: "assign" },
  { regex: /\bdisseminate\b/gi, replacement: "share" },
  { regex: /\bstipulate\b/gi, replacement: "state" },
  { regex: /\bdelineate\b/gi, replacement: "describe" },
  { regex: /\bpromulgate\b/gi, replacement: "announce" },
  { regex: /\bsupervision\b/gi, replacement: "oversight" },
  { regex: /\badjudicate\b/gi, replacement: "judge" },
  { regex: /\bcorroborate\b/gi, replacement: "confirm" },
  { regex: /\bcontingent upon\b/gi, replacement: "depending on" },
  { regex: /\bin accordance with\b/gi, replacement: "following" },
  { regex: /\bwith respect to\b/gi, replacement: "about" },
  { regex: /\bin conjunction with\b/gi, replacement: "with" },
  { regex: /\bfor the duration of\b/gi, replacement: "during" },
  { regex: /\bon the grounds that\b/gi, replacement: "because" },
  { regex: /\bin the absence of\b/gi, replacement: "without" },
  { regex: /\bby virtue of\b/gi, replacement: "by" },
  { regex: /\bpertaining to\b/gi, replacement: "about" },
  { regex: /\bconstitute\b/gi, replacement: "make up" },
  { regex: /\bcomprise\b/gi, replacement: "include" },
  { regex: /\bexpedite\b/gi, replacement: "speed up" },
  { regex: /\bamenable\b/gi, replacement: "open" },
  { regex: /\bcommensurate\b/gi, replacement: "matching" },
  { regex: /\bmitigate\b/gi, replacement: "reduce" },
  { regex: /\bremediate\b/gi, replacement: "fix" },

  { regex: /\bin a timely manner\b/gi, replacement: "quickly" },
  { regex: /\bas a matter of fact\b/gi, replacement: "in fact" },
  { regex: /\bdue to the fact that\b/gi, replacement: "because" },
  { regex: /\bat the present time\b/gi, replacement: "now" },
  { regex: /\bhas the ability to\b/gi, replacement: "can" },
  { regex: /\bis able to\b/gi, replacement: "can" },
];

const grade10Patterns = [
  ...commonPatterns,

  { regex: /\bthe determination of\b/gi, replacement: "deciding" },
  { regex: /\bthe establishment of\b/gi, replacement: "setting up" },
  { regex: /\bthe development of\b/gi, replacement: "developing" },
  { regex: /\bthe implementation of\b/gi, replacement: "doing" },
  { regex: /\bthe utilization of\b/gi, replacement: "using" },
  { regex: /\bthe examination of\b/gi, replacement: "examining" },
  { regex: /\bthe assessment of\b/gi, replacement: "assessing" },
  { regex: /\bthe evaluation of\b/gi, replacement: "evaluating" },
  { regex: /\bthe provision of\b/gi, replacement: "providing" },
  { regex: /\bthe acquisition of\b/gi, replacement: "getting" },

  { regex: /\bnotwithstanding the foregoing\b/gi, replacement: "even so" },
  { regex: /\bsubject to the provisions of\b/gi, replacement: "under" },
  { regex: /\bin consideration of\b/gi, replacement: "considering" },
  { regex: /\bto the extent that\b/gi, replacement: "as far as" },
  { regex: /\bwith reference to\b/gi, replacement: "about" },
  { regex: /\bin the context of\b/gi, replacement: "in" },
  { regex: /\bpredicated upon\b/gi, replacement: "based on" },
  { regex: /\bwith a view to\b/gi, replacement: "to" },
  { regex: /\bsubsequent to\b/gi, replacement: "after" },
  { regex: /\bconcurrent with\b/gi, replacement: "along with" },
  { regex: /\banalogous to\b/gi, replacement: "like" },
  { regex: /\bparamount\b/gi, replacement: "key" },
  { regex: /\bpredominant\b/gi, replacement: "main" },
  { regex: /\bperpetual\b/gi, replacement: "ongoing" },
  { regex: /\bpropensity\b/gi, replacement: "tendency" },
];

export const gradeConfig = {
  6: {
    targetFK: 6.0,
    maxAvgSentenceLength: 14,
    label: "Healthcare / Children",
  },
  8: {
    targetFK: 8.0,
    maxAvgSentenceLength: 18,
    label: "General Public / Government",
  },
  10: {
    targetFK: 10.0,
    maxAvgSentenceLength: 22,
    label: "Legal / Technical Professional",
  },
};

export const fillerPatterns = [
  { regex: /\bit is worth mentioning that\b/gi, replacement: "" },
  { regex: /\bneedless to say\b/gi, replacement: "" },
  { regex: /\bas a matter of course\b/gi, replacement: "" },
  { regex: /\ball things considered\b/gi, replacement: "" },
  { regex: /\bby and large\b/gi, replacement: "mostly" },
  { regex: /\bfor all intents and purposes\b/gi, replacement: "essentially" },
];

export function getPatternsByGrade(gradeLevel) {
  switch (String(gradeLevel)) {
    case "6":
      return grade6Patterns;
    case "8":
      return grade8Patterns;
    case "10":
      return grade10Patterns;
    default:
      return grade8Patterns;
  }
}

const patterns = {
  commonPatterns,
  grade6Patterns,
  grade8Patterns,
  grade10Patterns,
  getPatternsByGrade,
  gradeConfig,
  fillerPatterns,
};

export default patterns;
