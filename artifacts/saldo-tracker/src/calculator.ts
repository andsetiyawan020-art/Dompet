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
 * Examples:
 *   "100000"          → "100.000"
 *   "100000+50000"    → "100.000+50.000"
 *   "1500000*12"      → "1.500.000×12"
 */
function formatDisplayExpression(expr: string): string {
  if (!expr) return '0';
  return expr
    .replace(/(\d+(?:\.\d*)?)/g, (match) => {
      // Preserve trailing dot — user is mid-way through typing a decimal.
      // In id-ID format the decimal separator is a comma, so display "1.000,"
      // instead of dropping the dot entirely.
      const hasTrailingDot = match.endsWith('.');
      const n = parseFloat(match);
      if (isNaN(n)) return match;
      const formatted = new Intl.NumberFormat('id-ID').format(n);
      return hasTrailingDot ? formatted + ',' : formatted;
    })
    .replace(/\*/g, '×')
    .replace(/\//g, '÷');
}

/** Safe expression evaluator using only +, -, *, / */
function evaluateExpression(expr: string): number {
  // Only allow digits, operators, dots, spaces
  if (!/^[\d+\-*/.() ]+$/.test(expr)) throw new Error('Invalid expression');
  // eslint-disable-next-line no-new-func
  return Function('"use strict"; return (' + expr + ')')() as number;
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
