class BSTNode {
  left: BSTNode | null;
  right: BSTNode | null;
  value: any;
  key: string;
  constructor(key: string, value: any) {
    this.left = null;
    this.right = null;
    this.value = value;
    this.key = key;
  }
}

class BST {
  root: BSTNode | null;

  constructor() {
    this.root = null;
  }

  public add(key: string, value: any) {
    if (!this.root) {
      this.root = new BSTNode(key, value);
      return;
    }
    let curr = this.root;
    while (curr) {
      if (value < curr.value) {
        if (curr.left) {
          curr = curr.left;
        } else {
          curr.left = new BSTNode(key, value);
          return;
        }
      } else {
        if (curr.right) {
          curr = curr.right;
        } else {
          curr.right = new BSTNode(key, value);
          return;
        }
      }
    }
  }

  // Same KEY name replaces the former value
  toMap() {
    const map = {};
    if (!this.root) return map;
    const rec = (m, curr) => {
      if (curr.right) rec(m, curr.right);
      m[curr.key] = curr.value;
      if (curr.left) rec(m, curr.left);
    };
    rec(map, this.root);
    return map;
  }

  toMapReverse() {
    const map = new Map();
    if (!this.root) return map;
    const rec = (m, curr) => {
      if (curr.left) rec(m, curr.left);
      m.set(curr.key, curr.value);
      if (curr.right) rec(m, curr.right);
    };
    rec(map, this.root);
    return map;
  }
}

export default BST;
