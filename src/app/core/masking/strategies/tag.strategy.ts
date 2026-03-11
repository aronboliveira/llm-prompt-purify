/**
 * Tag Masking Strategy
 *
 * Replaces sensitive values with semantic XML-like tags
 * like <EMAIL>, <SSN>, <CREDIT_CARD>.
 *
 * @module TagStrategy
 */

import {
  CATEGORY_TAG_LABELS,
  RULE_TAG_MAP,
} from "../constants/masking.constants";
import {
  AbstractMaskingStrategy,
  type MaskingContext,
  type MaskingResult,
} from "./masking-strategy.interface";

/**
 * Strategy that generates semantic tag replacements.
 *
 * @example
 * "john.doe@email.com" → "<EMAIL>"
 * "123-45-6789" → "<SSN>"
 */
export class TagMaskingStrategy extends AbstractMaskingStrategy {
  readonly id = "tags";
  readonly name = "Tags";
  readonly description =
    "Replaces sensitive values with semantic XML-like tags";
  readonly priority = 40;

  protected doMask(context: MaskingContext): MaskingResult {
    const tagName = this.getTagName(context.ruleId, context.category);
    return {
      mask: `<${tagName}>`,
      complianceApplied: false,
      strategyId: this.id,
      metadata: { tagName },
    };
  }

  private getTagName(ruleId: string, category: string): string {
    // Direct lookup first - matches procedural createTagMask behavior
    const tagName =
      RULE_TAG_MAP[ruleId] ??
      CATEGORY_TAG_LABELS[category as keyof typeof CATEGORY_TAG_LABELS] ??
      "REDACTED";
    return tagName;
  }
}
