import type { FormTemplate } from "../contracts/forms";
import jsep, {
  type Expression as JsepExpression,
  type Identifier as JsepIdentifier,
  type MemberExpression as JsepMemberExpression,
  type Literal as JsepLiteral,
  type BinaryExpression as JsepBinaryExpression,
  type UnaryExpression as JsepUnaryExpression,
  type ConditionalExpression as JsepConditionalExpression,
} from "jsep";

export type ValidationError = { path: string; message: string; ref?: string };

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function safeGet(target: unknown, key: string | number): unknown {
  if (typeof key === "string" && FORBIDDEN_KEYS.has(key)) {
    throw new Error("Forbidden key");
  }
  if (target && typeof target === "object") {
    const record = target as Record<string | number, unknown>;
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      return record[key];
    }
  }
  return undefined;
}

function evaluateExpression(node: JsepExpression, scope: Record<string, unknown>): unknown {
  switch (node.type) {
    case "Literal":
      return (node as JsepLiteral).value;
    case "Identifier":
      return safeGet(scope, (node as JsepIdentifier).name);
    case "MemberExpression": {
      const member = node as JsepMemberExpression;
      const obj = evaluateExpression(member.object, scope);
      if (obj === null || obj === undefined) return undefined;
      const prop = member.computed
        ? evaluateExpression(member.property, scope)
        : (member.property as JsepIdentifier).name;
      if (typeof prop !== "string" && typeof prop !== "number") {
        return undefined;
      }
      return safeGet(obj, prop);
    }
    case "UnaryExpression": {
      const unary = node as JsepUnaryExpression;
      const value = evaluateExpression(unary.argument, scope);
      switch (unary.operator) {
        case "+":
          return Number(value);
        case "-":
          return -Number(value);
        case "!":
          return !value;
        default:
          throw new Error("Unsupported unary operator");
      }
    }
    case "BinaryExpression": {
      const binary = node as JsepBinaryExpression;
      const left = evaluateExpression(binary.left, scope) as any;
      const right = evaluateExpression(binary.right, scope) as any;
      switch (binary.operator) {
        case "+":
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          return left / right;
        case "%":
          return left % right;
        case "**":
          return left ** right;
        case "&&":
          return left && right;
        case "||":
          return left || right;
        case ">":
          return left > right;
        case ">=":
          return left >= right;
        case "<":
          return left < right;
        case "<=":
          return left <= right;
        case "==":
          return left == right;
        case "!=":
          return left != right;
        case "===":
          return left === right;
        case "!==":
          return left !== right;
        default:
          throw new Error("Unsupported binary operator");
      }
    }
    case "ConditionalExpression": {
      const conditional = node as JsepConditionalExpression;
      const test = evaluateExpression(conditional.test, scope);
      return test
        ? evaluateExpression(conditional.consequent, scope)
        : evaluateExpression(conditional.alternate, scope);
    }
    default:
      throw new Error("Unsupported expression");
  }
}

export function compute(values: Record<string, unknown>, template: FormTemplate) {
  const out: Record<string, unknown> = { ...values };

  for (const formula of template.formulas) {
    try {
      const scope = out as Record<string, unknown>;
      const ast = jsep(formula.expr);
      const result = evaluateExpression(ast, scope);
      if (typeof result === "number" && Number.isFinite(result)) {
        out[formula.out] = result;
      }
    } catch {
      // Leave derived field unchanged if parsing fails.
    }
  }

  return out;
}

export function validate(values: Record<string, unknown>, template: FormTemplate): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const rule of template.rules) {
    try {
      const scope = values as Record<string, unknown>;
      const ast = jsep(rule.when);
      const triggered = Boolean(evaluateExpression(ast, scope));
      if (triggered && rule.severity === "block") {
        errors.push({ path: "*", message: "Rule violation", ref: rule.ref });
      }
    } catch {
      // Skip invalid rules.
    }
  }

  return errors;
}
