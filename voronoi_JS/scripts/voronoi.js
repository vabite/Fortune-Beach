"use strict";

define(["event", "beachline", "geom"], function(Event, Beachline, Geom){

    function Voronoi(sites){
        this.sites=sites;
        this.events=[];
        sites.forEach(function(site){
            new Event(site).add(this.events);
        }, this);
        this.beach=new Beachline();
        this.edges=[];
        this.iterations=0;
    }

    Voronoi.prototype.addCircleEvent=function(arcNode, sweepY, approx){
        approx=approx||1e-10;
        var [lArcNode, lEdgeNode]=arcNode.getLLeafAndLParent();
        var [rArcNode, rEdgeNode]=arcNode.getRLeafAndRParent();
        if(lArcNode===undefined || rArcNode===undefined ||
            (lArcNode.item[0]===rArcNode.item[0] && lArcNode.item[1]===rArcNode.item[1]) ||
            (!Geom.doHalflinesCross(lEdgeNode.item, rEdgeNode.item))) return;
        var vertexCoord=Geom.circumCenter(lArcNode.item, arcNode.item, rArcNode.item);
        if(vertexCoord[1]==Infinity) return;
        var eventCoord=[vertexCoord[0], vertexCoord[1]+Geom.distPointToPoint(arcNode.item, vertexCoord)];
        if(eventCoord[1]<sweepY-approx) return;
        arcNode.cEvent=new Event([lArcNode, lEdgeNode, arcNode, rEdgeNode, rArcNode], eventCoord, vertexCoord);
        arcNode.cEvent.add(this.events);
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
        var crossedArcNode=this.beach.getArcNodeOnSite(event.coord);
        var lArcNode=crossedArcNode.getLLeafAndLParent()[0];
        var rArcNode=crossedArcNode.getRLeafAndRParent()[0];
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
        this.beach.rmArc(event.vertexCoord, event.arcsNodes, event.edgesNodes);
        this.rmCircleEvent(event.arcsNodes[0]);
        this.rmCircleEvent(event.arcsNodes[2]);
        this.addCircleEvent(event.arcsNodes[0], event.coord[1]);
        this.addCircleEvent(event.arcsNodes[2], event.coord[1]);
    }

    Voronoi.prototype.run=function(){
        this.beach.item=this.events.splice(0,1)[0].coord;
        this.iterations++;
        while(this.events.length>0){
            if(this.events[0].arcsNodes) this.manageCircleEvent()
            else this.manageSiteEvent();
            this.iterations++;

        };
    }

    Voronoi.prototype.plotEdges=function(width, height, pointSize, pointsColor, edgesColor){
      var t0 = new Date().getTime();
      this.run();
      var t1 = new Date().getTime();
      var nSites=this.sites.length;
      var pointSize=pointSize||4;

      var canv=document.createElement('canvas');
      canv.width=width||200;
      canv.height=height||200;
      canv.id='canvas';
      document.body.appendChild(canv);
      var ctx=canv.getContext("2d");
      ctx.fillStyle=pointsColor||"#FF0000";
      ctx.strokeStyle=edgesColor||"#00004c";

      this.sites.forEach(function(site){
        ctx.fillRect(site[0]-pointSize/2, site[1]-pointSize/2, pointSize, pointSize);
      });

      this.edges.forEach(function(edge){
        ctx.moveTo(edge.ps[0],edge.ps[1]);
        ctx.lineTo(edge.pe[0],edge.pe[1]);
      });
      ctx.stroke();

      var t2 = new Date().getTime();
      console.log("Completed. It took", t2-t0, "ms of which", t1-t0, "ms to run Voronoi (", this.iterations, "iterations).");
    }

    Voronoi.prototype.plotPatches=function(width, height, pointSize, pointsColor, edgesColor){
        var t0 = new Date().getTime();
        this.run();
        var t1 = new Date().getTime();
        var nSites=this.sites.length;
        var pointSize=pointSize||4;

        var canv=document.createElement('canvas');
        canv.width=width||200;
        canv.height=height||200;
        canv.id='canvas';
        document.body.appendChild(canv);
        var ctx=canv.getContext("2d");
        ctx.fillStyle=pointsColor||"#FF0000";
        ctx.strokeStyle=edgesColor||"#00004c";

        function isIn(point, array){
            for(var i=0; i<array.length; i++){
                    if(array[i][0]===point[0] && array[i][1]===point[1])
                        return true;
            };
            return false;
        }
        function insertByAtan(c, v, vs) {
            for(var i=0; i<vs.length; i++){
                if (Math.atan2((v[1]-c[1]), (v[0]-c[0])) <
                    Math.atan2((vs[i][1]-c[1]), (vs[i][0]-c[0]))) {
                    vs.splice(i, 0, v);
                    return;
                };
            };
            vs.push(v);
        }
        function assignEdgeBounds(edge){
            if(!(isIn(edge.ps, patches[edge.pl].vertices)))
                insertByAtan(patches[edge.pl].center, edge.ps, patches[edge.pl].vertices);
            if(!(isIn(edge.ps, patches[edge.pr].vertices)))
                insertByAtan(patches[edge.pr].center, edge.ps, patches[edge.pr].vertices);
            if(!(isIn(edge.pe, patches[edge.pl].vertices)))
                insertByAtan(patches[edge.pl].center, edge.pe, patches[edge.pl].vertices);
            if(!(isIn(edge.pe, patches[edge.pr].vertices)))
                insertByAtan(patches[edge.pr].center, edge.pe, patches[edge.pr].vertices);
        }

        var patches=Object.create(null);
        this.sites.forEach(function(site){
            patches[site]={center: site, vertices:[]};
        });
        this.edges.forEach(assignEdgeBounds);
        this.sites.forEach(function(site){
            var vs=patches[site].vertices;
            ctx.moveTo(vs[0][0], vs[0][1]);
            for(var i=1; i<vs.length; i++)
                ctx.lineTo(vs[i][0], vs[i][1]);
            ctx.fillRect(site[0]-pointSize/2, site[1]-pointSize/2, pointSize, pointSize);
        });
        ctx.stroke();
        var t2 = new Date().getTime();
        console.log("Completed. It took", t2-t0, "ms of which", t1-t0, "ms to run Voronoi (", this.iterations, "iterations).");
    }

//---------------------------------------------------------------------
    Voronoi.prototype.printObjArray= function (objs){
        objs.forEach(function(obj){
            console.log(String(obj));
        })
    }

    return Voronoi;
})
