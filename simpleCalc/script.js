function clearAll() {
  document.getElementById('display').value = ''
}

function deleteLast() {
  let currentValue = document.getElementById('display').value
  document.getElementById('display').value = currentValue.slice(0, -1)
}

function appendToDisplay(value) {
  document.getElementById('display').value += value
}

function calculateResult() {
  let expression = document.getElementById('display').value
  // Keep the expression within 100 chars
  if (expression.length > 100) {
    document.getElementById(
      'display'
    ).value = `Expression is too long(${expression.length} chars)`
    return
  }

  // Replace "√(" with "Math.sqrt("
  expression = expression.replace(/√\(/g, 'Math.sqrt(')
  // Replace "^" with "**"
  expression = expression.replace(/\^/g, '**')
  // Replace "√" followed by a number with "Math.sqrt(number)"
  expression = expression.replace(/√(\d+(\.\d+)?)/g, 'Math.sqrt($1)')
  // Replace "sin" followed by a number with "Math.sin(number)"
  expression = expression.replace(/sin\(/g, 'Math.sin(')
  expression = expression.replace(/cos\(/g, 'Math.cos(')
  try {
    let result = eval(expression)
    document.getElementById('display').value = result
  } catch {
    document.getElementById('display').value = `Error:${expression}`
  }
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    calculateResult()
  }
})
