import { gmailCleanupDecisionWorkflowBlueprint } from '@/lib/integrations/gmail/gmailReviewUnitContract'
import {
  defineDecisionWorkspacePresentation,
  type DecisionWorkspacePresentationDefinition,
} from '@/lib/runtime/decisionWorkspacePresentation'

const gmailContract = gmailCleanupDecisionWorkflowBlueprint('subtype-first')

const prompts: DecisionWorkspacePresentationDefinition['assistant']['prompts'] = {
  workspace: [
    'What should I look at in Inbox health first?',
    'Which review group should I start with?',
    'What should stay protected?',
  ],
  health_overview: [
    'Which senders dominate the whole mailbox versus the cleanup candidate universe?',
    'What does the protected/safe context say about cleanup risk?',
    'Which review group should I open next from this dashboard?',
  ],
  review_groups: [
    'Which review group is safest to start with?',
    'Why does this review group exist?',
    'How does this group narrow the sender universe?',
  ],
  item_overview: [
    'What does this review group represent before I start decisions?',
    'How many senders are already managed versus still eligible?',
    'When should I leave Sender Overview and enter Decision Mode?',
  ],
  decision_mode: [
    'Why is this sender in the current review group?',
    'Show engagement and protection signals for this sender.',
    'What Decision Management destination will this decision use?',
  ],
  decision_management: [
    'Which destination states need attention right now?',
    'What has been committed versus actually executed?',
    'Which sender states should I revisit next?',
  ],
}

const context: DecisionWorkspacePresentationDefinition['assistant']['context'] = {
  workspace:
    'Current context: Gmail decision workspace. Focus on Inbox health, sender-first cleanup status, and the next review group to open.',
  health_overview:
    'Current context: Inbox health. Focus on whole-mailbox sender analysis, cleanup candidate context, protected/safe context, and which review group should be reviewed next.',
  review_groups:
    'Current context: Review Groups. Focus on sender-group prioritization, scope narrowing, and the safest review order.',
  item_overview:
    'Current context: Sender Overview. Focus on review-group orientation, sender scope, progress, and when to enter Decision Mode.',
  decision_mode:
    'Current context: Decision Mode. Focus on one-sender-at-a-time classification, destination assignment, protection signals, and the correct Decision Management destination.',
  decision_management:
    'Current context: Decision Management. Focus on committed sender destinations, Gmail execution truth, warnings, and which destination states need follow-up next.',
}

export const gmailDecisionWorkspacePresentation = defineDecisionWorkspacePresentation({
  schemaVersion: 1,
  presentationId: 'builtin.gmail.mailbox_cleanup.presentation',
  version: '1',
  workflowDefinition: {
    definitionId: gmailContract.workflowDefinition.definitionId,
    version: gmailContract.workflowDefinition.version,
  },
  governance: {
    provenanceId: 'builtin.gmail.mailbox_cleanup.presentation.curated',
    authoredBy: 'Automata Gmail adapter',
    approvedBy: 'Human-governed published workflow',
    approvalStatus: 'human_approved',
    reversibleToVersion: null,
  },
  agentRoles: [{ id: 'mailbox_cleanup_operator', label: 'Mailbox cleanup operator' }],
  sources: gmailContract.sources.map((source) => ({
    id: source.id,
    providerType: source.providerType,
    providerLabel: 'Gmail',
    role: source.role,
  })),
  slots: {
    workspace: {
      semanticId: 'workspace',
      title: 'Gmail decision workspace',
      subtitle: 'Review sender evidence, make decisions, and control Gmail execution.',
      ariaLabel: 'Gmail decision workspace',
    },
    health_overview: {
      semanticId: 'health_overview',
      title: 'Inbox health',
      subtitle:
        'A visual read on sender decision coverage, Gmail execution friction, and the next useful intervention.',
      ariaLabel: 'Inbox health overview',
    },
    review_groups: {
      semanticId: 'review_groups',
      title: 'Review Groups',
      subtitle: 'Choose a bounded sender group to review next.',
      ariaLabel: 'Gmail sender Review Groups',
    },
    item_overview: {
      semanticId: 'item_overview',
      title: 'Sender Overview',
      subtitle: 'Understand sender scope, evidence, and progress before focused review.',
      ariaLabel: 'Sender Overview',
    },
    decision_mode: {
      semanticId: 'decision_mode',
      title: 'Decision Mode',
      subtitle: 'Review one sender at a time without mutating Gmail.',
      ariaLabel: 'Sender Decision Mode',
    },
    decision_management: {
      semanticId: 'decision_management',
      title: 'Decision Management',
      subtitle: 'Inspect committed destinations, Gmail execution truth, and follow-up.',
      ariaLabel: 'Gmail Decision Management',
    },
  },
  nouns: {
    universe: gmailContract.universe.label,
    subjectSingular: gmailContract.decisionSubject.singularLabel,
    subjectPlural: gmailContract.decisionSubject.pluralLabel,
    activitySingular: gmailContract.activity.singularLabel,
    activityPlural: gmailContract.activity.pluralLabel,
    evidenceSingular: 'Supporting message',
    evidencePlural: 'Supporting messages',
  },
  metricLabels: {
    itemsInScope: 'Senders in scope',
    reviewCandidates: 'Review candidates',
    decisionsMade: 'Decisions made',
    recommendations: 'Recommendations',
    executionStatus: 'Execution status',
  },
  semanticMetrics: gmailContract.metrics.map((metric) => ({
    id: metric.id,
    label: metric.label,
    valueType: metric.valueType,
    unit: metric.unit,
  })),
  actionLabels: gmailContract.actions.map((action) => ({ id: action.id, label: action.label })),
  providerControls: [
    {
      id: 'gmail.smart_sync',
      sourceId: 'gmail.primary',
      providerType: 'gmail',
      label: 'Smart Sync',
      requiredCapability: 'gmail.index_messages',
    },
    {
      id: 'gmail.continue_backfill',
      sourceId: 'gmail.primary',
      providerType: 'gmail',
      label: 'Continue Backfill',
      requiredCapability: 'gmail.index_messages',
    },
    {
      id: 'gmail.full_mailbox_reindex',
      sourceId: 'gmail.primary',
      providerType: 'gmail',
      label: 'Run full mailbox reindex',
      requiredCapability: 'gmail.index_messages',
    },
    {
      id: 'gmail.push',
      sourceId: 'gmail.primary',
      providerType: 'gmail',
      label: 'Push to Gmail',
      requiredCapability: 'gmail.archive_messages',
    },
    {
      id: 'gmail.restore_inbox',
      sourceId: 'gmail.primary',
      providerType: 'gmail',
      label: 'Restore to Inbox',
      requiredCapability: 'gmail.archive_messages',
    },
  ],
  assistant: { prompts, context },
  copy: {
    workspaceDescription:
      'Session-scoped decision workflow for sender review, destination management, and provider-specific Gmail controls.',
    controlCenterDescription:
      'Decision Management is the control center for committed sender destinations, Gmail execution truth, and undo. Pending Approvals and History remain legacy audit routes.',
    entryTitle: 'Opening the Gmail decision workspace',
    entryDescription:
      'Inbox health, review groups, sender decisions, approvals, execution truth, and next-step guidance share one coherent workflow.',
    healthExplanation:
      'Inbox health reflects decision coverage across the indexed sender universe. Message counts explain impact; they do not define whether the inbox is clean.',
  },
})
