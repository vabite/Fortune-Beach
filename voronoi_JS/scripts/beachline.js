"use strict";

define(["tree", "segment", "geom"], function(Tree, Segment, Geom){

  function Beachline(item, parent, l, r, cEvent){
    Tree.call(this, item, parent, l, r);
    this.cEvent=cEvent;
  }

  Beachline.prototype=Object.create(Tree.prototype);

  Beachline.prototype.isLeaf=function(){
    return this.l===undefined;
  }

  Beachline.prototype.getArcNodeOnSite=function(site){
    var [curNode, solN]=[this, undefined];
    while(!curNode.isLeaf()){
      //console.log(curNode.item);
      curNode.item.pl[1]<curNode.item.pr[1] ? solN=0 : solN=1;
      curNode = site[0]<Geom.parabolsCrossX(curNode.item.pl, curNode.item.pr, site[1])[solN] ? curNode["l"] : curNode["r"];
    };
    //console.log(curNode.item instanceof Segment, curNode.ps);
    //console.log("returned", curNode, curNode.item);
    return curNode;
  }

  Beachline.prototype.addArc=function(newArcSite, arcsNodes){
    var [lArcNode, crossedArcNode, rArcNode] = arcsNodes;
    var crossedArcSite=crossedArcNode.item;
    var crossPoint=[newArcSite[0], newArcSite[1]-Geom.distPointToParabol(
      newArcSite, crossedArcSite)];
    var newLHalfedge=new Segment(crossedArcSite, newArcSite, crossPoint);
    var newRHalfedge=new Segment(newArcSite, crossedArcSite, crossPoint);
    crossedArcNode.item=newLHalfedge;
    crossedArcNode.addLChild(new Beachline(crossedArcSite));
    crossedArcNode.addRChild(new Beachline(newRHalfedge));
    crossedArcNode.r.addLChild(new Beachline(newArcSite));
    crossedArcNode.r.addRChild(new Beachline(crossedArcSite));
    if(lArcNode!=undefined && lArcNode.cEvent!=undefined)
      lArcNode.cEvent.arcsNodes[2]=crossedArcNode.l;
    if(rArcNode!=undefined && rArcNode.cEvent!=undefined)
      rArcNode.cEvent.arcsNodes[0]=crossedArcNode.r.r;
  }

  Beachline.prototype.rmArc = function (newEdgeStart, arcsNodes, edgesNodes) {
    var [liveLArcNode, deadArcNode, liveRArcNode]=arcsNodes;
    if(deadArcNode.isRChild())
      var [liveCutBranch, midEdgeNode, topEdgeNode]=
          [edgesNodes[0].l, edgesNodes[0], edgesNodes[1]]
    else
      var [liveCutBranch, midEdgeNode, topEdgeNode]=
          [edgesNodes[1].r, edgesNodes[1], edgesNodes[0]];
    topEdgeNode.item=new Segment(liveLArcNode.item, liveRArcNode.item, newEdgeStart);
    if(midEdgeNode.isRChild()) midEdgeNode.parent.r=liveCutBranch
    else midEdgeNode.parent.l=liveCutBranch;
    liveCutBranch.parent=midEdgeNode.parent;
  }

 //------------------------------------------------------------------------
  Beachline.prototype.str_tree=function(path="Path: root"){
    if(this.item==undefined) return "Empty beachline.\n";
    var node_string=path+". Item: "+ String(this.item)+". cEvent:"+String(this.cEvent)+"\n";
    if(!this.isLeaf()){
        node_string+=this.l.str_tree(path+"->l");
        node_string+=this.r.str_tree(path+"->r");
      };
    return node_string;
  }

  console.log("beachline.js has been imported");
  return Beachline;

})
