export const GF1_IMPLEMENTATION_STEPS = [
  { key: 'contract_and_kickoff', label: 'Contract and Kickoff' },
  { key: 'system_configuration', label: 'System Configuration' },
  { key: 'data_collection', label: 'Data Collection' },
  { key: 'benefits_education_meeting', label: 'Benefits Education Meeting' },
  { key: 'onboarding_and_benefits_enrollment', label: 'Onboarding and Benefits Enrollment' },
  { key: 'enrollment_review', label: 'Enrollment Review' },
  { key: 'process_review_and_testing', label: 'Process Review and Testing' },
  { key: 'go_live_and_support', label: 'Go Live and Support' },
] as const;

export type Gf1ImplementationStepKey = (typeof GF1_IMPLEMENTATION_STEPS)[number]['key'];
