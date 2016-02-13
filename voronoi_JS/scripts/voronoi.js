"use strict";

define(["event", "beachline", "geom"], function(Event, Beachline, Geom){

    function Voronoi(sites){
        this.sites=sites;
        this.events=[];
        sites.forEach(function(site){
            new Event(site).add(this.events);
        }, this);
        this.beach=new Beachline();
        //console.log("Beachline:",this.beach.str_tree());
        this.edges=[];
        this.iterations=0;
    }

    Voronoi.prototype.addCircleEvent=function(arcNode, sweepY, approx){
        approx=approx||1e-10;
        //console.log("adding circle to node", arcNode, "at sweep", sweepY);
        var [lArcNode, lEdgeNode]=arcNode.getLLeafAndLParent();
        var [rArcNode, rEdgeNode]=arcNode.getRLeafAndRParent();
        if(lArcNode===undefined || rArcNode===undefined ||
            (lArcNode.item[0]===rArcNode.item[0] && lArcNode.item[1]===rArcNode.item[1]) ||
            (!Geom.doHalflinesCross(lEdgeNode.item, rEdgeNode.item))) {console.log("A"); return;}
        var vertexCoord=Geom.circumCenter(lArcNode.item, arcNode.item, rArcNode.item);
        //console.log("After", vertexCoord);
        if(vertexCoord[1]==Infinity) {console.log("B"); return;}
        var eventCoord=[vertexCoord[0], vertexCoord[1]+Geom.distPointToPoint(arcNode.item, vertexCoord)];
        if(eventCoord[1]<sweepY-approx) {console.log("C; event y", eventCoord[1], " sweep y", sweepY); return;}
        arcNode.cEvent=new Event([lArcNode, lEdgeNode, arcNode, rEdgeNode, rArcNode], eventCoord, vertexCoord);
        arcNode.cEvent.add(this.events);
        //console.log("event added");
        return;
    }

    Voronoi.prototype.rmCircleEvent=function(arcNode){
        if(arcNode.cEvent!==undefined){
            arcNode.cEvent.rm(this.events);
            arcNode.cEvent=undefined;
        }

    }

    Voronoi.prototype.manageSiteEvent=function(){
        var event=this.events.splice(0, 1)[0];
        //console.log("Event processed:", event, "Site above:", this.beach.getArcNodeOnSite(event.coord).item);
        var crossedArcNode=this.beach.getArcNodeOnSite(event.coord);
        var lArcNode=crossedArcNode.getLLeafAndLParent()[0];
        var rArcNode=crossedArcNode.getRLeafAndRParent()[0];
        //console.log("Coord of event processed", event, event["coord"]);
        this.rmCircleEvent(crossedArcNode);
        this.beach.addArc(event.coord, [lArcNode, crossedArcNode, rArcNode]);
        this.addCircleEvent(crossedArcNode.l, event.coord[1]);
        this.addCircleEvent(crossedArcNode.r.r, event.coord[1]);
    }

    Voronoi.prototype.manageCircleEvent=function(){
        var event=this.events.splice(0, 1)[0];
        var deadEdgeA=event.edgesNodes[0].item;
        var deadEdgeB=event.edgesNodes[1].item;
        deadEdgeA.pe=event.vertexCoord;
        deadEdgeB.pe=event.vertexCoord;
        this.edges.push(deadEdgeA);
        this.edges.push(deadEdgeB);
        //console.log("Managing the circle event", event);
        this.beach.rmArc(event.vertexCoord, event.arcsNodes, event.edgesNodes);
        this.rmCircleEvent(event.arcsNodes[0]);
        this.rmCircleEvent(event.arcsNodes[2]);
        this.addCircleEvent(event.arcsNodes[0], event.coord[1]);
        this.addCircleEvent(event.arcsNodes[2], event.coord[1]);
    }

    Voronoi.prototype.run=function(){
        //console.log("1st event processed");
        this.beach.item=this.events.splice(0,1)[0].coord;
        //console.log(this.beach.str_tree());
        //if(this.events) console.log(this.events);
        this.iterations++;
        while(this.events.length>0){
            //console.log("Other events processed");
            if(this.events[0].arcsNodes) this.manageCircleEvent()
            else this.manageSiteEvent();
            this.iterations++;
            //console.log(this.beach.str_tree());
            //this.printObjArray(this.events);
        };
    }

    Voronoi.prototype.plotEdges=function(width, height, sitesColor, edgesColor){
      var canv=document.createElement('canvas');
      canv.width=width||200;
      canv.height=height||200;
      canv.id='canvas';
      document.body.appendChild(canv);
      var ctx=canv.getContext("2d");

      this.run();
      var nSites=this.sites.length;
      var scaleF=Geom.distPointToPoint([0,0],[canv.width, canv.height])/2;
      var pointSize=scaleF/(nSites*4);
      console.log(pointSize);

      ctx.fillStyle=sitesColor||"#FF0000";
      for(var i=0; i<nSites; i++){
        console.log("Here", this.sites[i][0]-pointSize/2, this.sites[i][1]-pointSize/2);
        ctx.fillRect(this.sites[i][0]-pointSize/2, this.sites[i][1]-pointSize/2, pointSize, pointSize);
      };

      ctx.strokeStyle=edgesColor||"#00004c";
      for(var i=0; i<this.edges.length; i++){
        var e=this.edges[i]
        ctx.moveTo(e.ps[0],e.ps[1]);
        ctx.lineTo(e.pe[0],e.pe[1]);
      };
      ctx.stroke();

    }
//---------------------------------------------------------------------
    Voronoi.prototype.printObjArray= function (objs){
        objs.forEach(function(obj){
            console.log(String(obj));
        })
    }

    return Voronoi;
})
