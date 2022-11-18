/* const process = require('process')
const readline = require('readline')
// const interpret = (input) => evaluate(input)
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})
rl.on('close', function () {
  process.exit(0)
})
repl()
function repl () {
  rl.question('\n=>', function (input) {
    if (input === ':q' || input === ':quit') {
      rl.close()
    }
    try {
      console.log(main(input))
    } catch (err) {
      console.log(err)
    } finally {
      repl()
    }
  })
} */
const GE = {
  '#t': true,
  '#f': false,
  true: true,
  false: false,
  pi: Math.PI,
  sqrt: (args) => Math.sqrt(args),
  '=': function (args) { return args },
  cons: ([head, tail]) => [head, ...(Array.isArray(tail) ? tail : [tail])]
  // function (x, y) { return [x].concat(y); }
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
  if (input.includes(' ') /* && !input.startsWith('(') */) {
    return input.slice(input.indexOf(' '))
  } else {
    if (input.endsWith(')') /* && !input.startsWith('(') */) return input.slice(input.indexOf(')'))
  }
}
const next = (input) => {
  input = input.trim()
  if (input.startsWith('(')) return input.substring(0, nextClosingBracket(input) + 1)
  if (input.includes(' ') /* && !input.startsWith('(') */) {
    return input.substring(0, input.indexOf(' '))
  } else {
    if (input.endsWith(')') /* && !input.startsWith('(') */) return input.substring(0, input.indexOf(')'))
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
  if (!input.startsWith('(')) return null
  input = input.slice(1)

  const sym = next(input); input = pop(input)

  if (specialForms[sym]) { return specialForms[sym](input, GE) }

  // input = input.trim()
  const argsArr = getArgs(input).map(arg => evaluator(arg, GE))
  // console.log(argsArr)
  if (!input.endsWith(')')) return null
  input = input.slice(1)
  if (sym[0] === '(') {
    const lambdaF = evaluator(sym, GE)
    return lambdaF(...argsArr)
  }
  if (atomEval(sym, GE) === null) return null
  if (typeof GE[sym] === 'object') GE[sym] = GE[sym][0]
  if (GE[sym] !== 'undefined') return GE[sym](argsArr)
}
function evaluator (expression, GE) {
  if (expression[0] === '(') { return expressionEval(expression, GE) }
  return atomEval(expression, GE)
}

function getArgs (input) {
  const argsArr = []
  while (input) {
    input = input.trim()
    // if (input[0] === '(') {
    //   /* argsArr.push(input.substring(0, nextClosingBracket(input) + 1))
    //   input = input.substring(nextClosingBracket(input) + 1) */
    //   argsArr.push(next(input))
    //   input = pop(input)
    // } else {
    //   argsArr.push(next(input))
    //   input = pop(input)
    // }
    argsArr.push(next(input))
    input = pop(input)
    input = input.trim()
    if (!input.includes(' ')) { if (input[0] === ')') break }
  }

  return argsArr
}

function ifParser (input, GE) {
  const condition = evaluator(next(input), GE)
  input = pop(input)
  const trueExp = next(input)
  input = pop(input)
  const falseExp = next(input)
  input = pop(input)
  return condition ? evaluator(trueExp, GE) : evaluator(falseExp, GE)
}
function defineParser (input, GE) {
  const variable = next(input)
  input = pop(input)
  const expression = next(input)
  input = pop(input)
  GE[variable] = evaluator(expression, GE)
  return `${variable} defined`
}

function lambdaParser (input, GE) {
  input = input.trim()

  if (input[0] !== '(') { return null }
  /* const args = next(input)

   args = args.substring(1, args.length - 1)
  if (args.includes(' ')) { args = args.split(' ') } */
  const args = getArgs(next(input.substring(1))); input = pop(input)
  const exp = next(input); input = pop(input)

  function lambdaFunc (...funcArgs) {
    const localEnv = Object.create(GE)
    funcArgs.forEach((arg, index) => { localEnv[args[index]] = arg })
    return evaluator(exp, localEnv)
  }
  return lambdaFunc
}
function quoteParser (input, GE) {
  const datum = atomEval("\'" + next(input), GE)
  return datum
}
function setParser (input, GE) {
  const symbol = next(input); input = pop(input)
  const expression = next(input); input = pop(input)
  if (GE[symbol] === undefined) { console.log('can\'t set undefined variable') }
  GE[symbol] = evaluator(expression, GE)
  return `${symbol} Set`
}
function beginParser (input, GE) {
  const argsArr = getArgs(input).map(arg => evaluator(arg, GE))
  return argsArr[argsArr.length - 1]
}
function main (input) {
  return evaluator(input, GE)
}

/* const input = process.argv[2]
console.log(main(input))
 */
// ______________________________Math Cases_______________________________
console.log('Math')
console.log(main('-5 ') === -5)
console.log(main('pi') === 3.141592653589793)
console.log(main('-5') === -5)
console.log(main('(sqrt (/ 8 2))') === 2)
console.log(main('(* (/ 1 2) 3)') === 1.5)
console.log(main('(+ 1 (+ 2 3))') === 6)
console.log(main('( + ( + ( + 9 (+ 2 2)) 2) ( + 3 4) )') === 22)
console.log(main('(+ (+ 1 (- 1 1)) 1)') === 2)
console.log(main('(* 5 10)') === 50)
console.log(main('( * 1 2 ( / 10 4 2 ) ( + 6 5 ( - 1 2 3 ) ) ( + 2 3 ) )') === 87.5)

// _____________________________________if_______________________________
console.log('If')
console.log(main('( if (> 30 45) (+ 1 1) "failedOutput")') === '"failedOutput"')
console.log(main('(if (= 12 12) (+ 78 2) 9)') === 80)
console.log(main('(if #f 1 0)') === 0)
console.log(main('(if #t "abc" 1)') === '"abc"')

// ____________________________define____________________________________
console.log('Define')
console.log(main('(define a 90)'))
console.log(main('a'))
console.log(main('(set! a 100)'))
console.log(main('a'))
console.log(GE.a)
console.log(main('(define x (+ 5 5))'))

// _____________________________________quote____________________________________
console.log('Quote')
console.log(main('(quote (a b c))'))
console.log(main('(quote (+ 1 2)) '))

// _________________________begin__________________________________________

console.log('Begin')
console.log(main('(begin (define r 10) (* pi (* r r)))') === 314.1592653589793)
console.log(main('(begin (define r 10) (* pi (* r r)) (define a 100) (+ a a) 5)') === 5)

// ____________________________lambda and higher order functions_____________
console.log('Lambda')
console.log(main('((lambda (x) (+ x x)) (* 3 4))') === 24)
console.log(typeof (main('(lambda (x) (+ x x))')) === 'function')

main('(define x 4)')
console.log(main('((lambda (y) (+ y x)) 5)') === 9)

main('(define twice (lambda (x) (* 2 x)))')

console.log(main('(twice 5)') === 10)

main('(define repeat (lambda (f) (lambda (x) (f (f x)))))')

console.log(main('((repeat twice) 10)') === 40)
console.log(main('((repeat (repeat (repeat (repeat twice)))) 10)') === 655360)
console.log(main('((lambda (x) x) 10)') === 10)
console.log(main('(define fact (lambda (n) (if (<= n 1) 1 (* n (fact (- n 1))))))'))
console.log(main('(fact 10)') === 3628800)

console.log(main('(define fib (lambda (n) (if (< n 2) 1 (+ (fib (- n 1)) (fib (- n 2))))))'))
console.log(main('(fib 10)') === 89)

// ____________________________nested lambda(closures)______________________________________
console.log('Nested lambda')
main('(define rectangleArea (lambda (length) (lambda (bredth) (* length bredth))))')
main('(define areaLen2 (rectangleArea 2))')
console.log(main('(areaLen2 3)') === 6)
