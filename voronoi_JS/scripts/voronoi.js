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
        console.log("adding circle", arcNode, sweepY);

        var [lArcNode, lEdgeNode]=arcNode.getLLeafAndLParent();
        var [rArcNode, rEdgeNode]=arcNode.getRLeafAndRParent();
        if(lArcNode===undefined || rArcNode===undefined ||
            (lArcNode.item[0]===rArcNode.item[0] && lArcNode.item[1]===rArcNode.item[1]) ||
            (!Geom.doHalflinesCross(lEdgeNode.item, rEdgeNode.item))) return "A";
        var vertexCoord=Geom.circumCenter(lArcNode.item, arcNode.item, rArcNode.item);
        console.log("After", vertexCoord);
        if(vertexCoord[1]==Infinity) return "B";
        var eventCoord=[vertexCoord[0], vertexCoord[1]+Geom.distPointToPoint(arcNode.item, vertexCoord)];
        if(eventCoord[1]<sweepY+approx) return "C";
        arcNode.cEvent=new Event([lArcNode, lEdgeNode, arcNode, rEdgeNode, rArcNode], eventCoord, vertexCoord);
        arcNode.cEvent.add(this.events);
        return "OK";
    }

    Voronoi.prototype.rmCircleEvent=function(arcNode){
        if(arcNode.cEvent!==undefined){
            arcNode.cEvent.rm(this.events);
            arcNode.cEvent=undefined;
        }

    }

    Voronoi.prototype.manageSiteEvent=function(){
        var event=this.events.splice(0, 1)[0];
        console.log(event.coord, this.beach.getArcNodeOnSite(event.coord));
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
        deadEdgeA.end=event.vertexCoord;
        deadEdgeB.end=event.vertexCoord;
        this.beach.rmArc(event.vertexCoord, event.arcsNodes, event.edgesNodes);
        this.edges.push(deadEdgeA);
        this.edges.push(deadEdgeB);
        this.rmCircleEvent(event.arcsNodes[0]);
        this.rmCircleEvent(event.arcsNodes[2]);
        this.addCircleEvent(event.arcsNodes[0], event.coord[1]);
        this.addCircleEvent(event.arcsNodes[2], event.coord[1]);
    }

    Voronoi.prototype.run=function(){
        console.log("Here");
        this.beach.item=this.events.splice(0,1)[0].coord;
        console.log(this.beach.str_tree());
        if(this.events) console.log(this.events);
        this.iterations++;
        while(this.events.length>0){
            console.log("Here2");
            if(this.events[0].arcsNodes) this.manageCircleEvent()
            else this.manageSiteEvent();
            this.iterations++;
            console.log(this.beach.str_tree());
            printEvents(this.events);
        };
    }

    function printEvents(es){
        es.forEach(function(e){
            console.log(String(e));
        })
    }

    return Voronoi;
})
