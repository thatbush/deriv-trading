// @deriv/deriv-charts is built against React 16/17 and several of its toolbar
// widgets (StudyLegend, Views, Share, drawing-tool menus) still call
// `ReactDOM.findDOMNode`. Next 16 bundles React 19, which REMOVED findDOMNode, so
// rendering those widgets throws "findDOMNode is not a function" and crashes the
// chart. We restore a minimal, fiber-walking findDOMNode.
//
// Next's compiled react-dom *namespace* is frozen/non-extensible, so we cannot add
// a property to the `import * as ReactDOM` object. The library actually reads
// `findDOMNode` off the react-dom **default export** object, which is a separate,
// usually-extensible object — so we patch that (and try the namespace too, guarded).
//
// Import this for its side effect BEFORE importing from @deriv/deriv-charts.
import * as ReactDOMNamespace from 'react-dom';

type AnyRecord = Record<string, unknown>;

// Depth-first search a fiber subtree for the first host (DOM) node. react-dom's
// real findDOMNode returns the first host node rendered by the component, so we
// descend child→sibling, returning as soon as we hit a fiber with a Node stateNode.
function fiberToHostNode(fiber: AnyRecord | null | undefined): Node | null {
  let node: AnyRecord | null | undefined = fiber;
  while (node) {
    const stateNode = node.stateNode as unknown;
    if (stateNode instanceof Node) return stateNode;
    // Descend into children first.
    const child = node.child as AnyRecord | null;
    if (child) {
      const found = fiberToHostNode(child);
      if (found) return found;
    }
    // Then try the next sibling at this level.
    node = node.sibling as AnyRecord | null;
  }
  return null;
}

// React stores the fiber on the class-component instance under a version-specific
// key. Check the known keys, then fall back to any `__reactFiber$...` property.
function getFiber(inst: AnyRecord): AnyRecord | undefined {
  const known =
    (inst._reactInternals as AnyRecord | undefined) ??
    (inst._reactInternalFiber as AnyRecord | undefined);
  if (known) return known;
  for (const key of Object.keys(inst)) {
    if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
      return inst[key] as AnyRecord;
    }
  }
  return undefined;
}

function findDOMNodeShim(instance: unknown): Node | null {
  if (instance == null) return null;
  if (instance instanceof Node) return instance;

  const inst = instance as AnyRecord;

  const fiber = getFiber(inst);
  if (fiber) {
    const node = fiberToHostNode(fiber);
    if (node) return node;
  }

  if (inst.stateNode instanceof Node) return inst.stateNode;
  return null;
}

// Try to install findDOMNode on a target object, swallowing failures (frozen objs).
function tryInstall(target: unknown): boolean {
  if (!target || (typeof target !== 'object' && typeof target !== 'function')) {
    return false;
  }
  const obj = target as AnyRecord;
  if (typeof obj.findDOMNode === 'function') return true;
  try {
    obj.findDOMNode = findDOMNodeShim;
    return typeof obj.findDOMNode === 'function';
  } catch {
    // Frozen / non-extensible — try defineProperty (works if configurable).
    try {
      Object.defineProperty(obj, 'findDOMNode', {
        value: findDOMNodeShim,
        configurable: true,
        writable: true,
        enumerable: false,
      });
      return typeof obj.findDOMNode === 'function';
    } catch {
      return false;
    }
  }
}

const ns = ReactDOMNamespace as unknown as AnyRecord;
// The default export is the object the library dereferences (`ReactDOM.default`).
tryInstall(ns.default);
tryInstall(ns);
