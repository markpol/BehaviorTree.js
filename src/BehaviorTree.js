import { RUNNING } from './constants'
import Task from './Task'

let registry = {}

export function getRegistry() {
  return registry
}

export function registryLookUp(node) {
  if (typeof node === 'string') {
    const lookedUpNode = registry[node]
    if (!lookedUpNode) {
      throw new Error(`No node with name ${node} registered.`)
    }
    return lookedUpNode
  }
  return node
}

export default class BehaviorTree {
  constructor({ tree, blackboard }) {
    this.tree = tree
    this.blackboard = blackboard
    this.lastResult = null
  }

  step({ introspector } = {}) {
    const indexes = this.lastResult && typeof this.lastResult === 'object' ? this.lastResult : []
    const rerun = this.lastResult === RUNNING || indexes.length > 0
    if (introspector) {
      introspector.start(this)
    }
    this.lastResult = registryLookUp(this.tree).run(this.blackboard, {
      indexes,
      introspector,
      rerun,
      registryLookUp
    })
    if (introspector) {
      introspector.end()
    }
  }

  static register(name, node) {
    registry[name] = typeof node === 'function' ? new Task({ name, run: node }) : node
  }

  static cleanRegistry() {
    registry = {}
  }
}
