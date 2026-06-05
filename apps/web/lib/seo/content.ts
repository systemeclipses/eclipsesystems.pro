import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { packageDefinitions } from "@/lib/packages";

const contentRoot = path.join(process.cwd(), "content");
const siteUrl = "https://eclipsesystems.pro";

export type PlanContent = {
  slug: string;
  name: string;
  summary: string;
  bestFor: string;
  features: string[];
  moduleNote?: string;
  worksWith?: {
    packageName: string;
    copy: string;
  };
};

export type FeatureContent = {
  slug: string;
  name: string;
  summary: string;
  questions: string[];
};

export type CompetitorContent = {
  name: string;
  slug: string;
  website: string;
  last_verified: string;
  audience: string;
  pricing: { free: boolean; paid_from: number; seat_min: number };
  features: Record<string, boolean>;
  strengths: string[];
  weaknesses: string[];
  source_url: string;
};

export type LocationContent = {
  slug: string;
  city: string;
  state: string;
  title: string;
  description: string;
  wordCountTarget: number;
  localSignals: string[];
  industries: string[];
  body: string[];
};

export type IndustryContent = {
  slug: string;
  name: string;
  title: string;
  description: string;
  compliance: string;
  recommendedPlan: string;
  problems: string[];
  featureMap: { problem: string; feature: string }[];
  originalData: string;
};

export type UtbmsCode = {
  code: string;
  category: string;
  phase?: string;
  task: string;
  official_definition: string;
  practical_examples: string[];
  common_misuses: string[];
  related_codes: string[];
};

export type GlossaryTerm = {
  slug: string;
  term: string;
  definition: string;
  appliesTo: string;
  misconceptions: string[];
  related: string[];
};

async function readJson<T>(relativePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(contentRoot, relativePath), "utf8")) as T;
}

async function readYaml<T>(relativePath: string): Promise<T> {
  return YAML.parse(await fs.readFile(path.join(contentRoot, relativePath), "utf8")) as T;
}

async function readYamlDir<T>(directory: string): Promise<T[]> {
  const dir = path.join(contentRoot, directory);
  const files = await fs.readdir(dir);
  const yamlFiles = files.filter((file) => file.endsWith(".yaml")).sort();
  return Promise.all(yamlFiles.map((file) => readYaml<T>(path.join(directory, file))));
}

export async function loadPlans() {
  return packageDefinitions.map((pkg) => ({
    slug: pkg.slug,
    name: pkg.name,
    summary: pkg.description,
    bestFor: pkg.audience,
    features: pkg.features,
    moduleNote: pkg.moduleNote,
    worksWith: pkg.worksWith
  })) satisfies PlanContent[];
}

export async function loadFeatures() {
  return readJson<FeatureContent[]>("data/features.json");
}

export async function loadCompetitors() {
  return readYamlDir<CompetitorContent>("competitors");
}

export async function loadCompetitor(slug: string) {
  const competitors = await loadCompetitors();
  return competitors.find((competitor) => competitor.slug === slug) ?? null;
}

export async function loadLocations() {
  return readYamlDir<LocationContent>("locations");
}

export async function loadLocation(slug: string) {
  const locations = await loadLocations();
  return locations.find((location) => location.slug === slug) ?? null;
}

export async function loadIndustries() {
  return readYamlDir<IndustryContent>("industries");
}

export async function loadIndustry(slug: string) {
  const industries = await loadIndustries();
  return industries.find((industry) => industry.slug === slug) ?? null;
}

export async function loadUtbmsCodes() {
  return readYaml<UtbmsCode[]>("utbms/codes.yaml");
}

export async function loadUtbmsCode(code: string) {
  const codes = await loadUtbmsCodes();
  return codes.find((entry) => entry.code.toLowerCase() === code.toLowerCase()) ?? null;
}

export async function loadGlossary() {
  return readYamlDir<GlossaryTerm>("glossary");
}

export async function loadGlossaryTerm(slug: string) {
  const terms = await loadGlossary();
  return terms.find((term) => term.slug === slug) ?? null;
}

export function absoluteUrl(pathname: string) {
  return `${siteUrl}${pathname === "/" ? "" : pathname}`;
}
