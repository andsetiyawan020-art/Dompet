// ============================================================
// Floating Calculator Modal
// ============================================================

type CalcCallback = (value: number) => void;

let callback: CalcCallback | null = null;
let expression = '';
let displayEl: HTMLElement | null = null;
let expressionEl: HTMLElement | null = null;

export function initCalculator(): void {
  const modal = document.getElementById('calc-modal');
  if (!modal) return;

  displayEl = document.getElementById('calc-display');
  expressionEl = document.getElementById('calc-expression');

  // Button click handler
  modal.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-calc]') as HTMLElement | null;
    if (!btn) return;
    handleButton(btn.dataset.calc ?? '');
  });

  // Close overlay
  document.getElementById('calc-overlay')?.addEventListener('click', hideCalculator);
}

export function showCalculator(cb: CalcCallback): void {
  callback = cb;
  expression = '';
  updateDisplay('0', '');

  document.getElementById('calc-modal')?.classList.add('open');
  document.getElementById('calc-overlay')?.classList.add('open');
}

export function hideCalculator(): void {
  document.getElementById('calc-modal')?.classList.remove('open');
  document.getElementById('calc-overlay')?.classList.remove('open');
  callback = null;
}

function handleButton(action: string): void {
  if (action === 'clear') {
    expression = '';
    updateDisplay('0', '');
    return;
  }

  if (action === 'delete') {
    expression = expression.slice(0, -1);
    updateDisplay(expression ? formatDisplayExpression(expression) : '0', '');
    return;
  }

  if (action === 'equals') {
    try {
      const result = evaluateExpression(expression);
      if (isFinite(result)) {
        updateDisplay(formatCalcNumber(result), expression + ' =');
        expression = String(result);
        if (callback) {
          callback(Math.round(result));
          hideCalculator();
        }
      } else {
        updateDisplay('Error', '');
        expression = '';
      }
    } catch {
      updateDisplay('Error', '');
      expression = '';
    }
    return;
  }

  if (action === 'percent') {
    try {
      const result = evaluateExpression(expression) / 100;
      expression = String(result);
      updateDisplay(formatCalcNumber(result), '');
    } catch {
      // ignore
    }
    return;
  }

  // Operators and digits
  const last = expression.slice(-1);
  const isOperator = ['+', '-', '*', '/'].includes(action);
  const lastIsOperator = ['+', '-', '*', '/'].includes(last);

  if (isOperator && lastIsOperator) {
    // Replace last operator
    expression = expression.slice(0, -1) + action;
  } else {
    expression += action;
  }

  updateDisplay(formatDisplayExpression(expression), '');
}

function updateDisplay(value: string, expr: string): void {
  if (displayEl) displayEl.textContent = value;
  if (expressionEl) expressionEl.textContent = expr;
}

function formatCalcNumber(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n);
}

/**
 * Format the raw JS expression string for display only — no logic change.
 * Each number token gets thousand-separator dots (Indonesian locale).
 * Operator symbols * and / are replaced with × and ÷ for readability.
 */
function formatDisplayExpression(expr: string): string {
  if (!expr) return '0';
  return expr
    .replace(/(\d+(?:\.\d*)?)/g, (match) => {
      const hasTrailingDot = match.endsWith('.');
      const n = parseFloat(match);
      if (isNaN(n)) return match;
      const formatted = new Intl.NumberFormat('id-ID').format(n);
      return hasTrailingDot ? formatted + ',' : formatted;
    })
    .replace(/\*/g, '×')
    .replace(/\//g, '÷');
}

// ============================================================
// Safe Expression Evaluator — no eval() / new Function()
// Supports: +  -  *  /  ( )  decimal numbers
// ============================================================

/**
 * Recursive-descent parser for arithmetic expressions.
 * Grammar:
 *   expr   → term   (('+' | '-') term)*
 *   term   → factor (('*' | '/') factor)*
 *   factor → NUMBER | '(' expr ')'
 */
function evaluateExpression(raw: string): number {
  const src = raw.trim();
  if (!src) throw new Error('Empty expression');

  // Only allow digits, operators, parentheses, dots, spaces
  if (!/^[\d+\-*/.() ]+$/.test(src)) throw new Error('Invalid characters');

  let pos = 0;

  function peek(): string { return src[pos] ?? ''; }
  function consume(): string { return src[pos++] ?? ''; }

  function skipSpaces(): void {
    while (pos < src.length && src[pos] === ' ') pos++;
  }

  function parseNumber(): number {
    skipSpaces();
    let numStr = '';
    if (peek() === '-') { numStr += consume(); }
    while (pos < src.length && /[\d.]/.test(src[pos])) {
      numStr += consume();
    }
    if (!numStr || numStr === '-') throw new Error('Expected number at ' + pos);
    const n = parseFloat(numStr);
    if (isNaN(n)) throw new Error('Invalid number: ' + numStr);
    return n;
  }

  function parseFactor(): number {
    skipSpaces();
    if (peek() === '(') {
      consume(); // '('
      const val = parseExpr();
      skipSpaces();
      if (peek() === ')') consume();
      return val;
    }
    return parseNumber();
  }

  function parseTerm(): number {
    let left = parseFactor();
    skipSpaces();
    while (peek() === '*' || peek() === '/') {
      const op = consume();
      const right = parseFactor();
      if (op === '*') left *= right;
      else {
        if (right === 0) throw new Error('Division by zero');
        left /= right;
      }
      skipSpaces();
    }
    return left;
  }

  function parseExpr(): number {
    let left = parseTerm();
    skipSpaces();
    while (peek() === '+' || (peek() === '-' && src[pos - 1] !== undefined && !/[\d)]/.test(src[pos - 1]) === false)) {
      // Only treat '-' as binary subtraction when preceded by digit or ')'
      if (peek() === '-' && pos > 0 && /[\d)]/.test(src[pos - 1])) {
        consume();
        const right = parseTerm();
        left -= right;
      } else if (peek() === '+') {
        consume();
        const right = parseTerm();
        left += right;
      } else {
        break;
      }
      skipSpaces();
    }
    return left;
  }

  const result = parseExpr();
  if (pos < src.length && src.slice(pos).trim() !== '') {
    throw new Error('Unexpected token at ' + pos + ': ' + src.slice(pos));
  }
  return result;
}

export function getCalculatorHTML(): string {
  return `
    <div id="calc-overlay"></div>
    <div id="calc-modal" role="dialog" aria-label="Kalkulator">
      <div class="calc-header">
        <span>Kalkulator</span>
        <button class="calc-close" onclick="document.getElementById('calc-overlay').click()">✕</button>
      </div>
      <div class="calc-screen">
        <div id="calc-expression" class="calc-expression"></div>
        <div id="calc-display" class="calc-display">0</div>
      </div>
      <div class="calc-grid">
        <button data-calc="clear"    class="calc-btn btn-fn">AC</button>
        <button data-calc="delete"   class="calc-btn btn-fn">⌫</button>
        <button data-calc="percent"  class="calc-btn btn-fn">%</button>
        <button data-calc="/"        class="calc-btn btn-op">÷</button>

        <button data-calc="7"  class="calc-btn">7</button>
        <button data-calc="8"  class="calc-btn">8</button>
        <button data-calc="9"  class="calc-btn">9</button>
        <button data-calc="*"  class="calc-btn btn-op">×</button>

        <button data-calc="4"  class="calc-btn">4</button>
        <button data-calc="5"  class="calc-btn">5</button>
        <button data-calc="6"  class="calc-btn">6</button>
        <button data-calc="-"  class="calc-btn btn-op">−</button>

        <button data-calc="1"  class="calc-btn">1</button>
        <button data-calc="2"  class="calc-btn">2</button>
        <button data-calc="3"  class="calc-btn">3</button>
        <button data-calc="+"  class="calc-btn btn-op">+</button>

        <button data-calc="0"      class="calc-btn btn-zero">0</button>
        <button data-calc="."      class="calc-btn">,</button>
        <button data-calc="equals" class="calc-btn btn-eq">=</button>
      </div>
    </div>
  `;
}
