/* eslint-env jest */
import { RUNNING, SUCCESS, FAILURE } from './constants'
import BehaviorTree from './BehaviorTree'
import Task from './Task'
import InvertDecorator from './decorators/InvertDecorator'
import Introspector from './Introspector'
import Selector from './Selector'
import Sequence from './Sequence'

describe('Introspector', () => {
  let bTree
  let blackboard
  let introspector

  BehaviorTree.register(
    'simpleTask',
    new Task({
      name: 'The Task',
      start: function (blackboard) {
        ++blackboard.start
      },
      run: function (blackboard) {
        ++blackboard.run
        return blackboard.result
      },
      end: function (blackboard) {
        ++blackboard.end
      }
    })
  )
  BehaviorTree.register(
    'failingTask',
    new Task({
      name: 'Bumm',
      run: function (blackboard) {
        return FAILURE
      }
    })
  )

  beforeEach(() => {
    introspector = new Introspector()
  })

  it('is empty initially', () => {
    expect(introspector.lastResult).toEqual(null)
    expect(introspector.results).toEqual([])
  })

  describe('with the simplest tree possible', () => {
    beforeEach(() => {
      blackboard = {
        start: 0,
        run: 0,
        end: 0,
        result: SUCCESS
      }

      bTree = new BehaviorTree({ tree: 'simpleTask', blackboard })
    })

    it('puts in the result of the last run', () => {
      bTree.step({ introspector })

      const resultFirstRun = [
        {
          name: 'The Task',
          result: SUCCESS
        }
      ]

      expect(introspector.lastResult).toEqual(resultFirstRun)
      expect(introspector.results).toEqual([resultFirstRun])

      blackboard.result = FAILURE

      bTree.step({ introspector })

      const resultSecondRun = [
        {
          name: 'The Task',
          result: FAILURE
        }
      ]

      expect(introspector.lastResult).toEqual(resultSecondRun)
      expect(introspector.results).toEqual([resultFirstRun, resultSecondRun])

      blackboard.result = RUNNING

      bTree.step({ introspector })

      const resultThirdRun = [
        {
          name: 'The Task',
          result: RUNNING
        }
      ]

      expect(introspector.lastResult).toEqual(resultThirdRun)
      expect(introspector.results).toEqual([resultFirstRun, resultSecondRun, resultThirdRun])
    })
  })

  describe('with nameless tasks', () => {
    beforeEach(() => {
      blackboard = {
        start: 0,
        run: 0,
        end: 0,
        result: SUCCESS
      }

      bTree = new BehaviorTree({ tree: new Task({ run: () => RUNNING }), blackboard })
    })

    it('does not print a name', () => {
      bTree.step({ introspector })

      const resultFirstRun = [
        {
          result: RUNNING
        }
      ]

      expect(introspector.lastResult).toEqual(resultFirstRun)
      expect(introspector.results).toEqual([resultFirstRun])
    })
  })

  describe('with nameless branching nodes', () => {
    beforeEach(() => {
      blackboard = {
        start: 0,
        run: 0,
        end: 0,
        result: SUCCESS
      }

      bTree = new BehaviorTree({ tree: new Sequence({ nodes: ['simpleTask'] }), blackboard })
    })

    it('does not print a name', () => {
      bTree.step({ introspector })

      const resultFirstRun = [
        {
          children: [
            {
              name: 'The Task',
              result: SUCCESS
            }
          ],
          result: SUCCESS
        }
      ]

      expect(introspector.lastResult).toEqual(resultFirstRun)
      expect(introspector.results).toEqual([resultFirstRun])
    })
  })

  describe('with a decorator', () => {
    beforeEach(() => {
      blackboard = {
        start: 0,
        run: 0,
        end: 0,
        result: SUCCESS
      }
      const tree = new InvertDecorator({ name: 'inverter', node: 'simpleTask' })
      bTree = new BehaviorTree({ tree, blackboard })
    })

    it('shows Task and Decorator', () => {
      bTree.step({ introspector })

      const result = [
        {
          name: 'inverter',
          result: FAILURE,
          children: [
            {
              name: 'The Task',
              result: SUCCESS
            }
          ]
        }
      ]

      expect(introspector.lastResult).toEqual(result)
      expect(introspector.results).toEqual([result])
    })
  })

  describe('with a selector', () => {
    beforeEach(() => {
      blackboard = {
        start: 0,
        run: 0,
        end: 0,
        result: SUCCESS
      }
    })

    it('does not show task that did not run', () => {
      const tree = new Selector({ name: 'select', nodes: ['simpleTask', 'failingTask'] })
      bTree = new BehaviorTree({ tree, blackboard })

      bTree.step({ introspector })

      const result = [
        {
          name: 'select',
          result: SUCCESS,
          children: [
            {
              name: 'The Task',
              result: SUCCESS
            }
          ]
        }
      ]

      expect(introspector.lastResult).toEqual(result)
      expect(introspector.results).toEqual([result])
    })

    it('show all tasks if all did run', () => {
      const tree = new Selector({ name: 'select', nodes: ['failingTask', 'simpleTask'] })
      bTree = new BehaviorTree({ tree, blackboard })

      bTree.step({ introspector })

      const result = [
        {
          name: 'select',
          result: SUCCESS,
          children: [
            {
              name: 'Bumm',
              result: FAILURE
            },
            {
              name: 'The Task',
              result: SUCCESS
            }
          ]
        }
      ]

      expect(introspector.lastResult).toEqual(result)
      expect(introspector.results).toEqual([result])
    })
  })
})