import { RUNNING } from './constants'
import Task from './Task'

let registry = {}

function registryLookUp (node) {
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
  constructor ({ tree, blackboard }) {
    this.tree = tree
    this.blackboard = blackboard
    this.lastResult = null
  }

  step () {
    const indexes = this.lastResult && typeof this.lastResult === 'object' ? this.lastResult : []
    const rerun = this.lastResult === RUNNING || indexes.length > 0
    this.lastResult = registryLookUp(this.tree).run(this.blackboard, { indexes, rerun, registryLookUp })
  }

  static register (name, node) {
    registry[name] = typeof node === 'function'
      ? new Task({ run: node })
      : node
  }

  static cleanRegistry () {
    registry = {}
  }
}