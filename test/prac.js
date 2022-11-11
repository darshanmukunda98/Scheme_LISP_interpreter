const GE = {
  '#t': true,
  '#f': false,
  true: true,
  false: false,
  pi: Math.PI,
  sqrt: (...arg) => Math.sqrt(arg),
  '=': function (x, y) { return eval(x + ' ' + '===' + ' ' + y) }
}
const binaryops = ['+', '-', '*', '/', '>', '<', '>=', '<='].forEach(function (op) {
  GE[op] = function (x, y) { return eval(x + ' ' + op + ' ' + y) }
})

const specialForms = {
  if: ifParser,
  define: defineParser,
  lambda: lambdaParser,
  quote: quoteParser,
  'set!': setParser,
  begin: beginParser

}
function nextClosingBracket (input) {
  const arr = []
  let breaker = 0
  for (let i = 0; i < input.length; i++) {
    if (input[i] === '(') arr.push('(')
    if (input[i] === ')') arr.pop()
    if (arr.length === 0) { breaker = i; break }
  }
  return breaker
}
const pop = (input) => {
  input = input.trim()
  if (input.includes(' ') && !input.startsWith('(')) {
    return input.slice(input.indexOf(' '))
  } else {
    // return input.slice(input.indexOf(')') + 1)
    if (input.endsWith(')') && !input.startsWith('(')) return input.slice(input.indexOf(')'))
    return input.slice(nextClosingBracket(input) + 1)
  }
}
const next = (input) => {
  input = input.trim()
  if (input.includes(' ') && !input.startsWith('(')) {
    return input.substring(0, input.indexOf(' '))
  } else {
    // return input.substring(0, input.indexOf(')') + 1)
    if (input.endsWith(')') && !input.startsWith('(')) return input.substring(0, input.indexOf(')'))
    return input.substring(0, nextClosingBracket(input) + 1)
  }
}

function numberEval (atom) { // ignored number validation
  if (isNaN(Number(atom))) { return null }
  return Number(atom)
}

// symbolEval
function symbolEval (atom, GE) { // ignored symbol validation
  if (GE[atom] === undefined) { return null }
  return GE[atom]
}

// stringEval
function stringEval (atom) {
  const mached = atom.match(/".*"/) // ignored string validation  [\w!$%&*/:<=?>~_^+-/*#]+[\w\d]*
  if (mached) { return mached[0] }
  return null
}

// atomEval
function atomEval (atom) {
  if (atom[0] === '\'') { return atom.slice(1) } // 'abc -> abc
  if (numberEval(atom) === 0) { return 0 }
  if (symbolEval(atom, GE) === false) { return false }
  return numberEval(atom) || symbolEval(atom, GE) || stringEval(atom)
}

function expressionEval (input) {
  const args = []
  if (!input.startsWith('(')) return null
  input = input.slice(1)

  const sym = next(input)
  input = pop(input)
  // if (symbolEval(sym, GE) === null) return null
  if (specialForms[sym]) { return specialForms[sym](input) }
  if (sym[0] === '(') {
    op = expressionEval(sym, GE)
    return op
  }
  if (atomEval(sym) === null) return null

  while (input) {
    input = input.trim()
    if (input[0] === '(') {
      args.push(atomEval(expressionEval(input.substring(0, nextClosingBracket(input) + 1))))
      input = input.substring(nextClosingBracket(input) + 1)
    } else {
      args.push(atomEval(next(input)))
      input = pop(input)
    }
    input = input.trim()
    if (!input.includes(' ')) { if (input[0] === ')') break }
  }
  if (!input.endsWith(')')) return null
  input = input.slice(1)
  return args.reduce(GE[sym])
}
function evaluator (expression) {
  if (expression[0] === '(') { return expressionEval(expression) }
  return atomEval(expression)
}

function ifParser (input) {
  const condition = evaluator(next(input))
  input = pop(input)
  const trueExp = next(input)
  input = pop(input)
  const falseExp = next(input)
  input = pop(input)
  /* if (condition) {
    return trueExp
  } else { return falseExp } */
  return condition ? evaluator(trueExp) : evaluator(falseExp)
}
function defineParser (input) {
  const variable = next(input)
  input = pop(input)
  const expression = next(input)
  input = pop(input)
  GE[variable] = evaluator(expression)
  return '${variable} defined'
}
/* function lambdaParser (input) {
  input = input.trim()
  if (input[0] !== '(') { return null }
  const args = next(input)
  input = pop(input)
  const exp = next(input)
  input = pop(input)
} */
function quoteParser (input) {
  const datum = atomEval("\'" + next(input))
  return datum
}
function setParser (input) {

}
function beginParser (input) {

}

const input = process.argv[2]
// console.log(atomEval(input, GE))
console.log(evaluator(input))

/* // ______________________________Math Cases_______________________________
console.log('Math')
console.log(evaluator('-5 ') === -5)
console.log(evaluator('pi') === 3.141592653589793)
console.log(evaluator('-5') === -5)
// console.log(main('(sqrt (/ 8 2))') === 2)
console.log(evaluator('(* (/ 1 2) 3)') === 1.5)
console.log(evaluator('(+ 1 (+ 2 3))') === 6)
console.log(evaluator('( + ( + ( + 9 (+ 2 2)) 2) ( + 3 4) )') === 22)
console.log(evaluator('(+ (+ 1 (- 1 1)) 1)') === 2)
console.log(evaluator('(* 5 10)') === 50)

// _____________________________________if_______________________________
console.log('If')
console.log(evaluator('( if (> 30 45) (+ 1 1) "failedOutput")') === '"failedOutput"')
console.log(evaluator('(if (= 12 12) (+ 78 2) 9)') === 80)
console.log(evaluator('(if #f 1 0)') === 0)
console.log(evaluator('(if #t "abc" 1)') === '"abc"')

// ____________________________define____________________________________
console.log('Define')
console.log(evaluator('(define a 90)'))
console.log(evaluator('(define x (+ 5 5))'))

// _____________________________________quote____________________________________
console.log('Quote')
console.log(evaluator('(quote (a b c))') === '(a b c)')
console.log(evaluator('(quote (+ 1 2)) ') === '(+ 1 2)') */
