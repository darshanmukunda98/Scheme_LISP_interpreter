const GE = {
  '#t': true,
  '#f': false,
  true: true,
  false: false,
  pi: Math.PI,
  sqrt: (args) => Math.sqrt(args),
  '=': function (args) { return args.reduce((x, y) => eval(x + ' ' + '===' + ' ' + y)) }
}
const binaryops = ['+', '-', '*', '/', '>', '<', '>=', '<='].forEach(function (op) {
  GE[op] = function (args) { return args.reduce((x, y) => eval(x + ' ' + op + ' ' + y)) }
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
  if (input.startsWith('(')) return input.slice(nextClosingBracket(input) + 1)
  if (input.includes(' ') && !input.startsWith('(')) {
    return input.slice(input.indexOf(' '))
  } else {
    // return input.slice(input.indexOf(')') + 1)
    if (input.endsWith(')') && !input.startsWith('(')) return input.slice(input.indexOf(')'))
  }
}
const next = (input) => {
  input = input.trim()
  if (input.startsWith('(')) return input.substring(0, nextClosingBracket(input) + 1)
  if (input.includes(' ') && !input.startsWith('(')) {
    return input.substring(0, input.indexOf(' '))
  } else {
    // return input.substring(0, input.indexOf(')') + 1)
    if (input.endsWith(')') && !input.startsWith('(')) return input.substring(0, input.indexOf(')'))
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
  const matched = atom.match(/".*"/) // ignored string validation  [\w!$%&*/:<=?>~_^+-/*#]+[\w\d]*
  if (!matched[0]) { return null }

  return matched[0]
}

// atomEval
function atomEval (atom, GE) {
  if (atom[0] === '\'') { return atom.slice(1) } // 'abc -> abc
  if (numberEval(atom) === 0) { return 0 }
  if (symbolEval(atom, GE) === false) { return false }
  return numberEval(atom) || symbolEval(atom, GE) || stringEval(atom)
}

function expressionEval (input, GE) {
  const args = []
  if (!input.startsWith('(')) return null
  input = input.slice(1)

  const sym = next(input)
  input = pop(input)
  // if (symbolEval(sym, GE) === null) return null
  if (specialForms[sym]) { return specialForms[sym](input) }

  input = input.trim()
  // const argsArr = getArgs(input).map(arg => evaluator(arg))
  const argsArr = getArgs(input)
  /* while (input) {
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
  } */
  if (!input.endsWith(')')) return null
  input = input.slice(1)
  if (sym[0] === '(') {
    // console.log(input)
    // const op = expressionEval(sym, GE)
    const op = evaluator(sym, GE)
    return op(...argsArr)
  }
  if (atomEval(sym, GE) === null) return null
  // console.log(argsArr)
  if (typeof GE[sym] !== 'function') { console.log((GE[sym].toString() + ' ' + argsArr + ' ' + sym)) }
  return GE[sym](argsArr)
  /* return args.reduce(GE[sym]) */
}
function evaluator (expression, GE) {
  if (expression[0] === '(') { return expressionEval(expression, GE) }
  return atomEval(expression, GE)
}

function getArgs (input) {
  const argsArr = []
  while (input) {
    input = input.trim()
    if (input[0] === '(') {
      argsArr.push(/* atomEval( */ evaluator(input.substring(0, nextClosingBracket(input) + 1), GE))/* ) */
      input = input.substring(nextClosingBracket(input) + 1)
    } else {
      argsArr.push(atomEval(next(input), GE))
      input = pop(input)
    }
    input = input.trim()
    if (!input.includes(' ')) { if (input[0] === ')') break }
  }

  return argsArr
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
  GE[variable] = evaluator(expression, GE)
  console.log(`${variable} defined`)
}

function lambdaParser (input) {
  input = input.trim()
  // console.log(input)
  if (input[0] !== '(') { return null }
  let args = next(input)
  args = args.substring(1, args.length - 1)
  if (args.includes(' ')) { args = args.split(' ') }

  // console.log(args)
  input = pop(input)
  const exp = next(input)
  // console.log(exp)
  input = pop(input)

  // const localEnv = Object.create(GE)
  const localEnv = GE
  function lambdaFunc (...funcArgs) {
    funcArgs.forEach((arg, index) => { localEnv[args[index]] = arg })
    // console.log(localEnv)
    return evaluator(exp, localEnv)
  }
  return lambdaFunc
}
function quoteParser (input) {
  const datum = atomEval("\'" + next(input), GE)
  return datum
}
function setParser (input) {
  const symbol = next(input)
  input = pop(input)
  const expression = next(input)
  input = pop(input)
  if (GE[symbol] === undefined) { console.log('can\'t set undefined variable') }
  GE[symbol] = evaluator(expression, GE)
  // console.log(GE)
  console.log(`${symbol} Set`)
}
function beginParser (input) {
  const argsArr = getArgs(input)

  // argsArr.slice(0, argsArr.length - 1).forEach(arg => expressionEval(arg))
  return /* expressionEval( */argsArr[argsArr.length - 1]/* ) */
}

/* const input = process.argv[2]
console.log(evaluator(input, GE))
// console.log(atomEval(input)) */

/* // ______________________________Math Cases_______________________________
console.log('Math')
console.log(evaluator('-5 ', GE) === -5)
console.log(evaluator('pi', GE) === 3.141592653589793)
console.log(evaluator('-5', GE) === -5)
console.log(evaluator('(sqrt (/ 8 2))', GE) === 2)
console.log(evaluator('(* (/ 1 2) 3)', GE) === 1.5)
console.log(evaluator('(+ 1 (+ 2 3))', GE) === 6)
console.log(evaluator('( + ( + ( + 9 (+ 2 2)) 2) ( + 3 4) )', GE) === 22)
console.log(evaluator('(+ (+ 1 (- 1 1)) 1)', GE) === 2)
console.log(evaluator('(* 5 10)', GE) === 50)
console.log(evaluator('( * 1 2 ( / 10 4 2 ) ( + 6 5 ( - 1 2 3 ) ) ( + 2 3 ) )', GE) === 87.5)

// _____________________________________if_______________________________
console.log('If')
console.log(evaluator('( if (> 30 45) (+ 1 1) "failedOutput")') === '"failedOutput"')
console.log(evaluator('(if (= 12 12) (+ 78 2) 9)'))
console.log(evaluator('(if #f 1 0)') === 0)
console.log(evaluator('(if #t "abc" 1)') === '"abc"')

// ____________________________define____________________________________
console.log('Define')
console.log(evaluator('(define a 90)'))
console.log(evaluator('a'))
console.log(evaluator('(set! a 100)'))
console.log(evaluator('a'))
console.log(GE.a)
console.log(evaluator('(define x (+ 5 5))'))

// _____________________________________quote____________________________________
console.log('Quote')
console.log(evaluator('(quote (a b c))'))
console.log(evaluator('(quote (+ 1 2)) '))

// _________________________begin__________________________________________

console.log('Begin')
console.log(evaluator('(begin (define r 10) (* pi (* r r)))') === 314.1592653589793)
console.log(evaluator('(begin (define r 10) (* pi (* r r)) (define a 100) (+ a a) 5)') === 5)
 */
// ____________________________lambda and higher order functions_____________
console.log('Lambda')
console.log(evaluator('((lambda (x) (+ x x)) (* 3 4))', GE) === 24)
console.log(typeof (evaluator('(lambda (x) (+ x x))', GE)) === 'function')

evaluator('(define x 4)', GE)
console.log(evaluator('((lambda (y) (+ y x)) 5)', GE) === 9)

evaluator('(define twice (lambda (x) (* 2 x)))', GE)
console.log(evaluator('(twice 5)', GE) === 10)

evaluator('(define repeat (lambda (f) (lambda (x) (f (f x)))))', GE)
console.log(evaluator('(repeat twice)', GE))
console.log(GE)
console.log(evaluator('( ( repeat twice ) 10 )', GE) === 40)
