import assert from 'node:assert/strict'
import {
  materializeReviewUnits,
  validateReviewUnitContract,
} from '../src/lib/runtime/reviewUnitContract.ts'

const sizing = { targetMin: 50, targetMax: 300, hardMax: 400 }

function records(count, prefix, values) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${String(index).padStart(4, '0')}`,
    ...values,
  }))
}

function adapter(blueprint, partitionValue) {
  return {
    adapterId: `${blueprint.workspaceType}:${blueprint.workflowId}`,
    blueprint,
    entityId: (entity) => entity.id,
    partitionValue: ({ dimension, entity, context }) =>
      partitionValue(dimension, entity, context),
  }
}

const cryptoBlueprint = {
  schemaVersion: 1,
  workspaceType: 'crypto_investing',
  workflowId: 'portfolio_risk_review',
  universe: { type: 'portfolio', label: 'Investment portfolio' },
  decisionSubject: {
    type: 'position',
    singularLabel: 'Position',
    pluralLabel: 'Positions',
  },
  evidenceKinds: ['risk_level', 'strategy', 'allocation', 'liquidity'],
  actions: [
    { id: 'hold', label: 'Hold' },
    { id: 'reduce', label: 'Reduce' },
    { id: 'exit', label: 'Exit' },
    { id: 'monitor', label: 'Monitor' },
  ],
  reviewUnits: { dimensions: ['risk_level', 'strategy'], sizing },
}
const cryptoPositions = [
  ...records(230, 'high-risk', { riskLevel: 'high', strategy: 'growth' }),
  ...records(190, 'medium-risk', { riskLevel: 'medium', strategy: 'income' }),
  ...records(100, 'unknown-risk', { riskLevel: null, strategy: 'unclassified' }),
]
const cryptoAdapter = adapter(cryptoBlueprint, (dimension, position) => {
  if (dimension === 'risk_level') {
    const key = position.riskLevel || 'unknown'
    return {
      key,
      label: key === 'unknown' ? 'Unknown risk' : `${key[0].toUpperCase()}${key.slice(1)} risk`,
      sourceKind: 'risk_level',
      unitRole: key === 'unknown' ? 'remainder' : 'risk_lane',
    }
  }
  return {
    key: position.strategy || 'unknown',
    label: position.strategy || 'Unknown strategy',
    sourceKind: 'strategy',
    unitRole: 'strategy_lane',
  }
})
const cryptoPlan = materializeReviewUnits({
  parentId: 'portfolio.risk_review',
  parentLabel: 'Portfolio risks',
  actionable: true,
  entities: cryptoPositions,
  context: {},
  adapter: cryptoAdapter,
})
const cryptoValidation = validateReviewUnitContract({
  parentId: 'portfolio.risk_review',
  actionable: true,
  parentEntityIds: cryptoPositions.map((position) => position.id),
  units: cryptoPlan.units,
  reviewUnitIdByEntityId: cryptoPlan.reviewUnitIdByEntityId,
  hardMax: sizing.hardMax,
})
assert.deepEqual(cryptoValidation.errors, [])
assert.equal(cryptoPlan.blueprintIdentity.decisionSubjectType, 'position')
assert.equal(cryptoPlan.units.reduce((sum, unit) => sum + unit.entityCount, 0), 520)
assert(cryptoPlan.units.some((unit) => unit.label === 'Unknown risk'))
assert(cryptoPlan.units.every((unit) => unit.entityCount <= sizing.hardMax))

const taxTransactionBlueprint = {
  schemaVersion: 1,
  workspaceType: 'tax_accounting',
  workflowId: 'transaction_review',
  universe: { type: 'client_books', label: 'Client books' },
  decisionSubject: {
    type: 'transaction',
    singularLabel: 'Transaction',
    pluralLabel: 'Transactions',
  },
  evidenceKinds: ['review_reason', 'tax_year', 'account', 'amount', 'documentation_status'],
  actions: [
    { id: 'categorize', label: 'Categorize' },
    { id: 'match_document', label: 'Match document' },
    { id: 'escalate', label: 'Escalate for review' },
    { id: 'exclude', label: 'Exclude' },
  ],
  reviewUnits: { dimensions: ['review_reason', 'tax_year'], sizing },
}
const taxTransactions = [
  ...records(200, 'uncategorized', { reviewReason: 'uncategorized', taxYear: '2026' }),
  ...records(150, 'missing-document', { reviewReason: 'missing_document', taxYear: '2026' }),
  ...records(100, 'tax-unknown', { reviewReason: null, taxYear: 'unknown' }),
]
const taxTransactionAdapter = adapter(
  taxTransactionBlueprint,
  (dimension, transaction) => {
    const value = dimension === 'review_reason' ? transaction.reviewReason : transaction.taxYear
    const key = value || 'unknown'
    return {
      key,
      label:
        key === 'unknown'
          ? 'Unclassified review reason'
          : key.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase()),
      sourceKind: dimension,
      unitRole: key === 'unknown' ? 'remainder' : 'decision_queue',
    }
  }
)
const taxTransactionPlan = materializeReviewUnits({
  parentId: 'tax.transactions_needing_decisions',
  parentLabel: 'Transactions needing decisions',
  actionable: true,
  entities: taxTransactions,
  context: {},
  adapter: taxTransactionAdapter,
})
const taxTransactionValidation = validateReviewUnitContract({
  parentId: 'tax.transactions_needing_decisions',
  actionable: true,
  parentEntityIds: taxTransactions.map((transaction) => transaction.id),
  units: taxTransactionPlan.units,
  reviewUnitIdByEntityId: taxTransactionPlan.reviewUnitIdByEntityId,
  hardMax: sizing.hardMax,
})
assert.deepEqual(taxTransactionValidation.errors, [])
assert.equal(taxTransactionPlan.blueprintIdentity.decisionSubjectType, 'transaction')
assert.equal(taxTransactionPlan.units.reduce((sum, unit) => sum + unit.entityCount, 0), 450)
assert(taxTransactionPlan.units.some((unit) => unit.label === 'Unclassified review reason'))

const taxDocumentBlueprint = {
  ...taxTransactionBlueprint,
  workflowId: 'document_collection',
  universe: { type: 'client_tax_file', label: 'Client tax file' },
  decisionSubject: {
    type: 'document',
    singularLabel: 'Document',
    pluralLabel: 'Documents',
  },
  evidenceKinds: ['document_type', 'request_status', 'tax_year'],
  actions: [
    { id: 'request', label: 'Request document' },
    { id: 'match', label: 'Match document' },
    { id: 'waive', label: 'Waive requirement' },
  ],
  reviewUnits: { dimensions: ['document_type'], sizing },
}
const taxDocuments = [
  ...records(180, 'receipt', { documentType: 'receipts' }),
  ...records(170, 'income-statement', { documentType: 'income_statements' }),
]
const taxDocumentPlan = materializeReviewUnits({
  parentId: 'tax.missing_documentation',
  parentLabel: 'Missing documentation',
  actionable: true,
  entities: taxDocuments,
  context: {},
  adapter: adapter(taxDocumentBlueprint, (_dimension, document) => ({
    key: document.documentType,
    label: document.documentType.replaceAll('_', ' '),
    sourceKind: 'document_type',
    unitRole: 'document_queue',
  })),
})
assert.equal(taxDocumentPlan.blueprintIdentity.workspaceType, 'tax_accounting')
assert.equal(taxDocumentPlan.blueprintIdentity.decisionSubjectType, 'document')
assert.equal(taxDocumentPlan.units.reduce((sum, unit) => sum + unit.entityCount, 0), 350)

assert.throws(
  () =>
    materializeReviewUnits({
      parentId: 'portfolio.unsplittable',
      parentLabel: 'Unsplittable positions',
      actionable: true,
      entities: records(401, 'same-position', { riskLevel: 'same', strategy: 'same' }),
      context: {},
      adapter: cryptoAdapter,
    }),
  /cannot be semantically partitioned/
)

console.log(
  JSON.stringify(
    {
      status: 'PASS',
      crypto: {
        workflow: cryptoPlan.blueprintIdentity,
        parent_count: cryptoValidation.parentEntityCount,
        child_counts: cryptoPlan.units.map((unit) => unit.entityCount),
      },
      tax_transactions: {
        workflow: taxTransactionPlan.blueprintIdentity,
        parent_count: taxTransactionValidation.parentEntityCount,
        child_counts: taxTransactionPlan.units.map((unit) => unit.entityCount),
      },
      tax_documents: {
        workflow: taxDocumentPlan.blueprintIdentity,
        parent_count: taxDocuments.length,
        child_counts: taxDocumentPlan.units.map((unit) => unit.entityCount),
      },
      multiple_decision_subjects_in_one_workspace: true,
      explicit_remainders: true,
      fail_closed_over_400: true,
    },
    null,
    2
  )
)
