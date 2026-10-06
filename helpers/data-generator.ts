function uniqueValue(prefix: string) {
  const random = Math.random().toString(36).slice(2, 10);

  return `${prefix}_${Date.now()}_${random}`;
}

export function categoryName() {
  return uniqueValue('AUTO_CATEGORY');
}

export function ruleValue() {
  return uniqueValue('E2E_RULE');
}

export function transactionDescription(matchValue: string) {
  return `${matchValue} TEST_TRANSACTION`;
}