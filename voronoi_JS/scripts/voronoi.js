"use strict";

define(["event", "beachline", "geom"], function(Event, Beachline, Geom){

    function Voronoi(sites){
        this.sites=sites;
        this.events=[];
        this.beach=new Beachline();
        this.edges=[];
        this.patches=Object.create(null);
        this.iterations=0;
        sites.forEach(function(site){
            this.patches[site]=[];
            new Event(site).add(this.events);
        }, this);

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

    Voronoi.prototype.getPoints=function(){
        return this.sites;
    }

    Voronoi.prototype.getEdges=function(){
        var t0=new Date().getTime();
        this.beach.item=this.events.splice(0,1)[0].coord;
        this.iterations++;
        while(this.events.length>0){
            if(this.events[0].arcsNodes) this.manageCircleEvent()
            else this.manageSiteEvent();
            this.iterations++;
        };
        console.log("Got edges in", new Date().getTime()-t0, "ms");
        return this.edges;
    }

    Voronoi.prototype.getPatches=function(width, height, pointSize, pointsColor, edgesColor){
        var t0=new Date().getTime();

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
        function assignEdgeBounds(edge) {
            if (!(isIn(edge.ps, this.patches[edge.pl])))
                insertByAtan(edge.pl, edge.ps, this.patches[edge.pl]);
            if (!(isIn(edge.ps, this.patches[edge.pr])))
                insertByAtan(edge.pr, edge.ps, this.patches[edge.pr]);
            if (!(isIn(edge.pe, this.patches[edge.pl])))
                insertByAtan(edge.pl, edge.pe, this.patches[edge.pl]);
            if (!(isIn(edge.pe, this.patches[edge.pr])))
                insertByAtan(edge.pr, edge.pe, this.patches[edge.pr]);
        }

        this.getEdges().forEach(assignEdgeBounds, this);
        console.log("Got patches in", new Date().getTime()-t0, "ms");
        return this.patches;
    }

    return Voronoi;
})
