import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'espree'

const root = path.resolve('src')
const files = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(js|jsx)$/.test(entry.name)) files.push(full)
  }
}

walk(root)

function scopeOf(node, scopes) {
  return scopes[scopes.length - 1]
}

function declares(scope, name) {
  return scope.bindings.has(name) || scopesHas(scope.parent, name)
}

function scopesHas(scope, name) {
  let current = scope
  while (current) {
    if (current.bindings.has(name)) return true
    current = current.parent
  }
  return false
}

const hits = []

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8')
  let ast
  try {
    ast = parse(code, { ecmaVersion: 'latest', sourceType: 'module', jsx: true })
  } catch (err) {
    hits.push(`${file}: PARSE ${err.message}`)
    continue
  }

  const rootScope = { bindings: new Set(['undefined', 'arguments']), parent: null }
  const stack = [rootScope]

  function push(bindings = []) {
    const scope = { bindings: new Set(bindings), parent: stack[stack.length - 1] }
    stack.push(scope)
    return scope
  }

  function addBinding(name) {
    if (name) stack[stack.length - 1].bindings.add(name)
  }

  function pattern(node) {
    if (!node) return
    if (node.type === 'Identifier') addBinding(node.name)
    else if (node.type === 'ObjectPattern') node.properties.forEach((prop) => pattern(prop.type === 'RestElement' ? prop.argument : prop.value || prop.argument))
    else if (node.type === 'ArrayPattern') node.elements.forEach(pattern)
    else if (node.type === 'AssignmentPattern') pattern(node.left)
    else if (node.type === 'RestElement') pattern(node.argument)
  }

  function visit(node) {
    if (!node || typeof node !== 'object') return
    if (node.type === 'Identifier' && node.name === 'error') {
      const parent = node._parent
      const isMember = parent?.type === 'MemberExpression' && parent.property === node && !parent.computed
      const isPropKey = (parent?.type === 'Property' || parent?.type === 'ObjectProperty') && parent.key === node && !parent.computed
      const isLabel = parent?.type === 'LabeledStatement'
      if (!isMember && !isPropKey && !isLabel && !scopesHas(stack[stack.length - 1], 'error')) {
        const line = code.slice(0, node.start).split('\n').length
        hits.push(`${path.relative(root, file)}:${line}`)
      }
    }

    const scoped = new Set([
      'FunctionDeclaration',
      'FunctionExpression',
      'ArrowFunctionExpression',
      'CatchClause',
      'BlockStatement',
      'ForStatement',
      'ForInStatement',
      'ForOfStatement',
      'SwitchStatement',
    ])

    let opened = false
    if (scoped.has(node.type) && node.type !== 'BlockStatement') {
      const names = []
      if (node.type === 'FunctionDeclaration') names.push(node.id?.name)
      if (node.type === 'CatchClause' && node.param?.type === 'Identifier') names.push(node.param.name)
      push()
      opened = true
      if (node.type.startsWith('Function') || node.type === 'ArrowFunctionExpression') {
        node.params?.forEach(pattern)
        if (node.type === 'FunctionDeclaration' && node.id) addBinding(node.id.name)
      }
    } else if (node.type === 'BlockStatement' && node._parent && !['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'CatchClause'].includes(node._parent.type)) {
      push()
      opened = true
    }

    if (node.type === 'VariableDeclarator') pattern(node.id)
    if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') addBinding(node.id?.name)
    if (node.type === 'ImportSpecifier' || node.type === 'ImportDefaultSpecifier' || node.type === 'ImportNamespaceSpecifier') {
      addBinding(node.local?.name)
    }

    for (const key of Object.keys(node)) {
      if (key === '_parent') continue
      const value = node[key]
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child.type === 'string') {
            child._parent = node
            visit(child)
          }
        }
      } else if (value && typeof value.type === 'string') {
        value._parent = node
        visit(value)
      }
    }

    if (opened) stack.pop()
  }

  ast._parent = null
  visit(ast)
}

console.log(hits.length ? hits.join('\n') : 'none')
