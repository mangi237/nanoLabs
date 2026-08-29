/**
 * Google Translate & Browser Translation DOM Monkey-Patch for React
 * 
 * Problem:
 * When Google Translate, Chrome built-in translation, or browser translation extensions
 * translate a React application, they modify the DOM by wrapping text nodes in <font> tags,
 * splitting text nodes, or changing parent-child relationships.
 * 
 * When React performs reconciliation during state changes or database updates (e.g. Firebase Firestore
 * snapshots, patient queues, test bookings, inventory reloads), React attempts to call:
 *   - Node.prototype.removeChild
 *   - Node.prototype.insertBefore
 *   - Node.prototype.replaceChild
 * on nodes that have been detached, re-parented, or wrapped by Google Translate.
 * This throws fatal DOMExceptions ("The node to be removed is not a child of this node"),
 * which unmounts the React root tree and causes the entire application to crash / go blank.
 * 
 * Solution:
 * This script intercepts (monkey-patches) React's DOM manipulation commands right before
 * any crash happens. If the target child is not a direct child of the calling parent node,
 * it safely routes the operation to the child's actual parent or performs a safe fallback,
 * preventing any crash and allowing real-time database updates and Google Translate to run together.
 */

export function applyDOMMonkeyPatch(): void {
    if (typeof window === 'undefined' || typeof Node === 'undefined' || !Node.prototype) {
      return;
    }
  
    // Prevent applying the patch multiple times
    if ((window as any).__REACT_TRANSLATE_DOM_PATCH_APPLIED__) {
      return;
    }
    (window as any).__REACT_TRANSLATE_DOM_PATCH_APPLIED__ = true;
  
    // 1. Monkey-Patch Node.prototype.removeChild
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
      if (!child) return child;
      if (child.parentNode !== this) {
        if (child.parentNode) {
          try {
            return child.parentNode.removeChild(child) as T;
          } catch (e) {
            return child;
          }
        }
        return child;
      }
      try {
        return originalRemoveChild.call(this, child) as T;
      } catch (err) {
        if (child.parentNode) {
          try {
            return child.parentNode.removeChild(child) as T;
          } catch (e) {
            return child;
          }
        }
        return child;
      }
    };
  
    // 2. Monkey-Patch Node.prototype.insertBefore
    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
      if (!newNode) return newNode;
      if (referenceNode && referenceNode.parentNode !== this) {
        if (referenceNode.parentNode) {
          try {
            return referenceNode.parentNode.insertBefore(newNode, referenceNode) as T;
          } catch (e) {
            // fallback
          }
        }
        try {
          return this.appendChild(newNode) as T;
        } catch (e) {
          return newNode;
        }
      }
      try {
        return originalInsertBefore.call(this, newNode, referenceNode) as T;
      } catch (err) {
        if (referenceNode && referenceNode.parentNode) {
          try {
            return referenceNode.parentNode.insertBefore(newNode, referenceNode) as T;
          } catch (e) {}
        }
        try {
          return this.appendChild(newNode) as T;
        } catch (e) {
          return newNode;
        }
      }
    };
  
    // 3. Monkey-Patch Node.prototype.replaceChild
    const originalReplaceChild = Node.prototype.replaceChild;
    Node.prototype.replaceChild = function <T extends Node>(newChild: Node, oldChild: T): T {
      if (!newChild || !oldChild) return oldChild;
      if (oldChild.parentNode !== this) {
        if (oldChild.parentNode) {
          try {
            return oldChild.parentNode.replaceChild(newChild, oldChild) as T;
          } catch (e) {
            // fallback
          }
        }
        try {
          return this.appendChild(newChild) as T;
        } catch (e) {
          return oldChild;
        }
      }
      try {
        return originalReplaceChild.call(this, newChild, oldChild) as T;
      } catch (err) {
        if (oldChild.parentNode) {
          try {
            return oldChild.parentNode.replaceChild(newChild, oldChild) as T;
          } catch (e) {}
        }
        try {
          return this.appendChild(newChild) as T;
        } catch (e) {
          return oldChild;
        }
      }
    };
  
    console.log('✅ Google Translate DOM Monkey-Patch active: Protected React from DOM reconciliation crashes.');
  }
  
  // Auto-apply immediately when imported
  applyDOMMonkeyPatch();
  