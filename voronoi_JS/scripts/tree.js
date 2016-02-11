"use strict";

define([], function(){

  function BinaryTree(item, parent, l, r){
    this.item=item;
    this.parent=parent;
    this.l=l;
    this.r=r;
  }

  BinaryTree.prototype.isRoot=function(){
    return this.parent==undefined;
  };

  BinaryTree.prototype.isLeaf=function(){
    return this.l==undefined && this.r==undefined;
  };

  BinaryTree.prototype.isLchild=function(){
    return !this.isRoot() && this.parent.l===this;
  };

  BinaryTree.prototype.isRchild=function(){
    return !this.isRoot() && this.parent.r===this;
  };

  BinaryTree.prototype.addLchild=function(child){
    this.l=child;
    child.parent=this;
  };

  BinaryTree.prototype.addRchild=function(child){
    this.r=child;
    child.parent=this;
  };

  return BinaryTree;

})
