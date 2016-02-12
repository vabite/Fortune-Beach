"use strict";

console.log("Start of main.js");

require(["Geom", "segment", "tree", "beachline", "event", "voronoi"],
    function(Geom, Segment, Tree, Beachline, Event, Voronoi){
        console.log("-------GEOMETRY TEST-------");

        var distP2P=Geom.distPointToPoint([0,0],[1,1]);
        console.log("distance between points:", distP2P);

        var distP2Par=Geom.distPointToParabol([0,1], [1,1]); //point is on directrix
        // console.log("Distance point to parabol:", distP2Par);

        var cc=Geom.circumCenter([0,-2],[Math.sqrt(2),Math.sqrt(2)],[-Math.sqrt(2),Math.sqrt(2)]);
        console.log("Center of circumference:", cc);

        var cross_x=Geom.parabolsCrossX([-1,2],[3,1],0);
        console.log("Parabol cross x:", cross_x);

        console.log("-------SEGMENT TEST-------");

        var hl1=new Segment( [0,0], [-2,-1], [1,0]);
        console.log("Halfline m, halfplane, start point, end point:", hl1.m, ";", hl1.hp, ";", hl1.ps, ";", hl1.pe);

        var hl2=new Segment([0,1], [-1,0],   [0,0]);
        console.log("Halfline m, halfplane, start point, end point:", hl2.m, ";", hl2.hp, ";", hl2.ps, ";", hl2.pe);

        console.log("Do halflines cross?", Geom.doHalflinesCross(hl1, hl2) ? "Yes" : "No");

        console.log("-------TREE TEST-------");

        var t=new Tree(0);
        console.log("An element! Its item is", t.item, ". Is it root?", t.isRoot(), " Is it now a leaf?", t.isLeaf());
        t.addLChild(new Tree(1));
        t.addRChild(new Tree(2));
        console.log("Now a left child and a right child are added.")
        console.log("Its children have items, at the left", t.l.item, "and at the right", t.r.item);
        console.log("The LChild is really a LChild?", t.l.isLChild() , ". The LChild is a RChild?", t.l.isRChild(), ". The LChild is root?", t.l.isRoot());
        console.log("The RChild is really a RChild?", t.r.isRChild() , ". The RChild is a LChild?", t.r.isLChild(), ". The RChild is root?", t.r.isRoot());
        console.log("Is the root a leaf?", t.isLeaf(), ". Is the left leaf a leaf?", t.l.isLeaf(), ". Is the right leaf a leaf?", t.r.isLeaf())
        t.r.addLChild(new Tree(5));
        t.r.addRChild(new Tree(6));
        t.r.l.addLChild(new Tree(11));
        t.r.l.addRChild(new Tree(12));
        console.log(t.str_tree());
        console.log("LLeaves and LParents items of leaves from left to right: ");
        console.log(t.l.getLLeafAndLParent());
        console.log(t.r.l.l.getLLeafAndLParent()[0].item, t.r.l.l.getLLeafAndLParent()[1].item);
        console.log(t.r.l.r.getLLeafAndLParent()[0].item, t.r.l.r.getLLeafAndLParent()[1].item);
        console.log(t.r.r.getLLeafAndLParent()[0].item, t.r.r.getLLeafAndLParent()[1].item);
        console.log("RLeaves and RParents items of leaves from right to left: ");
        console.log(t.r.r.getRLeafAndRParent());
        console.log(t.r.l.r.getRLeafAndRParent()[0].item, t.r.l.r.getRLeafAndRParent()[1].item);
        console.log(t.r.l.l.getRLeafAndRParent()[0].item, t.r.l.l.getRLeafAndRParent()[1].item);
        console.log(t.l.getRLeafAndRParent()[0].item, t.l.getRLeafAndRParent()[1].item);


        console.log("-------BEACHLINE TEST-------");  //MANCA ANALISI CIRCLE EVENT

        var beach=new Beachline([0,0]);

        console.log("Aggiungo sito [1,1]. Interseca arco [0,0] in [1,0]");
        var leaf=beach;
        var ll=leaf.getLLeafAndLParent()[0];
        var rl=leaf.getRLeafAndRParent()[0];
        var arcsNodes=[ll, leaf, rl];
        var newSite=[1,1]
        beach.addArc(newSite, arcsNodes);
        console.log(beach.str_tree());

        console.log("Aggiungo sito [2,2]. Interseca arco [1,1] in [2,1]");
        leaf=beach.getArcNodeOnSite([2,2]);
        ll=leaf.getLLeafAndLParent()[0];
        rl=leaf.getRLeafAndRParent()[0];
        arcsNodes=[ll, leaf, rl];
        newSite=[2,2]
        beach.addArc(newSite, [ll, leaf, rl]);
        console.log(beach.str_tree());

        leaf=beach.r.l.l;
        var [ll, le]=leaf.getLLeafAndLParent();
        var [rl, re]=leaf.getRLeafAndRParent();
        arcsNodes=[ll, leaf, rl];
        var newEdgeStart=[10,10];
        beach.rmArc(newEdgeStart, [ll, leaf, rl], [le, re]);
        console.log(beach.str_tree());


        console.log("-------EVENT TEST-------");
        function printEvents(es){
          es.forEach(function(e){
            console.log(String(e));
          })
        }
        //console.log("Creo site event");
        var es=new Event([0,2]);
        //console.log(String(es));
        //console.log("Creo circle event");
        var ec=new Event([new Beachline([0,2-2]), new Beachline("seg1"),
            new Beachline([Math.sqrt(2),2+Math.sqrt(2)]), new Beachline("seg2"),
            new Beachline([-Math.sqrt(2),2+Math.sqrt(2)])], [0,2], [0,4]);
        console.log(String(ec));
        console.log("Now I create an event list. They should be in order of y");
        var es=[];
        var coords=[[0,3], [0,5], [1,4], [6,2], [2,4], [7,4], [5,6]]
        for(var i=0; i<coords.length; i++){
          new Event(coords[i]).add(es);
        };
        printEvents(es);
        console.log("Now I remove the first event");
        es[0].rm(es);
        printEvents(es);
        console.log("Now I remove the last event");
        es[5].rm(es);

        console.log("Now I remove the first event with y=4");
        new Event([7,4]).rm(es);
        printEvents(es);

        console.log("Now I remove the last event with y=4");
        new Event([1,4]).rm(es);
        printEvents(es);

        console.log("Now I try to remove an event that does not exist");
        new Event([1,9]).rm(es);
        printEvents(es);

        console.log("Now I add a circle event");
        ec.add(es);
        printEvents(es);


        console.log("-------VORONOI TEST-------");
        var v=new Voronoi([[0,0], [1,1], [-1,1]]);
        console.log("Voronoi sites:");
        v.sites.forEach(function(s){
            console.log(String(s));
        });
        console.log("Voronoi events:");
        printEvents(v.events);
        console.log("Voronoi beachline:", v.beach.str_tree());

        v.beach=beach;
        console.log("Voronoi beachline:", v.beach.str_tree());

        //Building a new beach
        v.beach=new Beachline([0,0]);

        var leaf=v.beach;
        var ll=leaf.getLLeafAndLParent()[0];
        var rl=leaf.getRLeafAndRParent()[0];
        var arcsNodes=[ll, leaf, rl];
        var newSite=[1,1]
        v.beach.addArc(newSite, arcsNodes);

        leaf=v.beach.getArcNodeOnSite([1,2]);
        ll=leaf.getLLeafAndLParent()[0];
        rl=leaf.getRLeafAndRParent()[0];
        arcsNodes=[ll, leaf, rl];
        newSite=[1,2]
        v.beach.addArc(newSite, [ll, leaf, rl]);

        console.log(beach.str_tree());

        console.log("Adding circle event to first leaf:", v.addCircleEvent(v.beach.l, 0));
        console.log("Adding circle event to last leaf:", v.addCircleEvent(v.beach.r.r, 0));
        console.log("Adding circle event to second leaf (segments do not intersect):", v.addCircleEvent(v.beach.r.l.l, 0));
        console.log("Adding circle event to fourth leaf (same side arcs focus):", v.addCircleEvent(v.beach.r.l.r.l, 0));
        console.log("Adding circle event to third leaf (with event y < sweep y):", v.addCircleEvent(v.beach.r.l.r.r, 3.1));
        console.log("Adding circle event to third leaf (OK):", v.addCircleEvent(v.beach.r.l.r.r, 0));

        console.log("Beachline:", v.beach.str_tree(), "; events:");
        printEvents(v.events);
        console.log("Removing circle event");
        v.rmCircleEvent(v.beach.r.l.r.r);
        console.log("Beachline:", v.beach.str_tree());
        printEvents(v.events);

        v.beach=new Beachline(new Segment([-1,0],[0,0],[-0.5,0]));
        v.beach.addLChild(new Beachline([-1,0]));
        v.beach.addRChild(new Beachline(new Segment([0,0],[1,0],[0.5,0])));
        v.beach.r.addLChild(new Beachline([0,0]));
        v.beach.r.addRChild(new Beachline([1,0]));
        console.log("Adding circle event to first leaf:", v.addCircleEvent(v.beach.r.l, 0));
        console.log(v.beach.str_tree());
        printEvents(v.events);

        console.log("------------MAIN TEST----------");
        var [x1, y1, x2, y2]=[Math.cos(Math.PI/8), Math.sin(Math.PI/8), Math.cos(3*Math.PI/8), Math.sin(3*Math.PI/8)];
        var hCenteredOctagon=[[0,0],[x1,y1],[x2,y2],[-x1,y1],[-x2,y2],[-x1,-y1],[-x2,-y2],[x1,-y1],[x2,-y2]];
        var v1=new Voronoi([[0,0], [1,1], [-1,1]]); //[-100,0],[100,0],[0,100],[0,-100]
        v1.run();


        /*
        v1.beach.item=v1.events.splice(0,1)[0].coord;
        console.log(v1.beach.str_tree());
        printEvents(v1.events);
        for(i=0; i<2; i++){
            v1.manageSiteEvent();
            console.log(v1.beach.str_tree());
            printEvents(v1.events);
        };


        //v1.run();
        //v1.edges.forEach(function(edge){
        //    console.log(String(edge));
        //})

    */

        console.log("End of main.js");


})
