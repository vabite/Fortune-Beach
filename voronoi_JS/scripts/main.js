"use strict";

console.log("In main");

require(["geom", "segment", "tree"], function(geom, Segment, Tree){

  var distP2P=geom.distPointToPoint([0,0],[1,1]);
  console.log("distance between points:", distP2P);

  var distP2Par=geom.distPointToParabol([0,1], [1,1]); //point is on directrix
  console.log("Distance point to parabol:", distP2Par);

  var cc=geom.circumCenter([0,-2],[Math.sqrt(2),Math.sqrt(2)],[-Math.sqrt(2),Math.sqrt(2)]);
  console.log("Center of circumference:", cc);

  var cross_x=geom.parabolsCrossX([-1,2],[3,1],0);
  console.log("Parabol cross x:", cross_x);

  var hl1=new Segment( [0,0], [-2,-1], [1,0]);
  console.log("Halfline m, halfplane, start point, end point:", hl1.m, ";", hl1.hp, ";", hl1.ps, ";", hl1.pe);

  var hl2=new Segment([0,1], [-1,0],   [0,0]);
  console.log("Halfline m, halfplane, start point, end point:", hl2.m, ";", hl2.hp, ";", hl2.ps, ";", hl2.pe);

  console.log("Do halflines cross?", geom.doHalflinesCross(hl1, hl2) ? "Yes" : "No");

  var t=new Tree(0);
  console.log("An element! Its item is", t.item, ". Is it root?", t.isRoot(), " Is it now a leaf?", t.isLeaf());
  t.addLchild(new Tree(1));
  t.addRchild(new Tree(2));
  console("Now a left child and a right child are added.")
  console.log("Its children have items, at the left", t.l.item, "and at the right", t.r.item);
  console.log("The lchild is really a lchild?", t.l.isLchild() , ". The lchild is a rchild?", t.l.isRchild(), ". The lchild is root?", t.l.isRoot());
  console.log("The rchild is really a rchild?", t.r.isRchild() , ". The rchild is a lchild?", t.r.isLchild(), ". The rchild is root?", t.r.isRoot());
  console.log("Is the root a leaf?", t.isLeaf(), ". Is the left leaf a leaf?", t.l.isLeaf(), ". Is the right leaf a leaf?", t.r.isLeaf())
  console.log("End of main.js");
})
