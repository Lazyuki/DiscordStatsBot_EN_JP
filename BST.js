class Node {
  constructor(key, value) {
    this.left = null;
    this.right = null;
    this.value = value;
    this.key = key;
  }
}

module.exports = class BST {
  constructor() {
    this.root = null;
  }

  add(key, value) {
    if (!this.root) {
      this.root = new Node(key, value);
      return;
    }
    var curr = this.root;
    while (curr) {
      if (value < curr.value) {
        if (curr.left) {
          curr = curr.left;
        } else {
          curr.left = new Node(key, value);
          return;
        }
      } else {
        if (curr.right) {
          curr = curr.right;
        } else {
          curr.right = new Node(key, value);
          return;
        }
      }
    }
  }

  toMap() {
    var map = {};
    var rec = function(map, curr) {
      if (curr.right) rec(map, curr.right);
      map[curr.key] = curr.value;
      if (curr.left) rec(map, curr.left)
    };
    rec(map, this.root);
    return map;
  }
}
