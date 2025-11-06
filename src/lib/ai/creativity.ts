const SYN = {
  start: ["Build", "Create", "Craft", "Develop", "Spin up"],
  aiTutor: ["AI tutor", "smart coach", "learning bot", "study assistant", "mentoring agent"],
  value: ["personalized help", "custom guidance", "tailored feedback", "adaptive hints", "on-demand support"],
  result: ["learn faster", "boost grades", "master concepts", "study smarter", "level up skills"],
};

type SynKey = keyof typeof SYN;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function pick(arr: string[], temp: number) {
  const safeTemp = clamp(temp);
  const span = Math.max(1, Math.round(arr.length * safeTemp));
  const pool = arr.slice(0, span).concat(arr.slice(-span));
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? arr[0];
}

function line(topic: string, temp: number) {
  const descriptor = topic.trim() || "AI tutor";
  const chosenRole = pick(SYN.aiTutor, temp);
  const resolvedRole = chosenRole.includes("AI tutor")
    ? chosenRole.replace("AI tutor", descriptor)
    : `${descriptor} ${chosenRole.startsWith(descriptor) ? "" : `(${chosenRole})`}`.trim();
  return `${pick(SYN.start, temp)} a ${resolvedRole} that gives ${pick(SYN.value, temp)} so students ${pick(
    SYN.result,
    temp,
  )}.`;
}

export function pitch(topic = "AI tutor", temp = 0.2) {
  return line(topic, clamp(temp));
}

export type PitchBundle = {
  low: string;
  medium: string;
  high: string;
};

export function buildPitchBundle(topic: string, baseTemp: number): PitchBundle {
  return {
    low: pitch(topic, clamp(baseTemp * 0.5)),
    medium: pitch(topic, clamp((baseTemp + 1) / 2)),
    high: pitch(topic, clamp(baseTemp || 1)),
  };
}
