"use strict";

console.log("Start of main.js");

requirejs.config({
  baseUrl: './scripts',
});

require(["voronoi", "geom"],
    function(Voronoi, Geom){

        var vFourPoints=[[0,-0.3], [0,-0.1], [0, 0.1], [0,0.3]];
        var hFourPoints=[[-0.3,0], [-0.1,0], [0.1,0], [0.3,0]];
        var vTriangle=[[0,-0.5], [0.5,0.5], [-0.5,0.5]];
        var hTriangle=[[0,0.5], [0.5,-0.5], [-0.5,-0.5]]
        var vRectangle=[[0,-0.5],[-0.5,0],[0.5,0],[0,0.65]];
        var hRectangle=[[-0.5,0],[0,-0.5],[0,0.5],[0.65,0]];
        var vSquare=[[0,-0.5],[-0.5,0],[0.5,0],[0,0.5]];
        var vCSquare=[[0,0],...vSquare];
        var hSquare=[[-0.5,-0.5],[0.5,-0.5],[0.5,0.5],[-0.5,0.5]];
        var hCSquare=[[0,0],[-0.5,-0.5],[0.5,-0.5],[0.5,0.5],[-0.5,0.5]];
        var vOctagon=[[0,-0.5],[-Math.sqrt(2)/4, -Math.sqrt(2)/4], [Math.sqrt(2)/4,-Math.sqrt(2)/4],[-0.5,0], [0.5,0] ,[Math.sqrt(2)/4, Math.sqrt(2)/4], [-Math.sqrt(2)/4, Math.sqrt(2)/4], [0, 0.5]];
        var vCOctagon=[[0,0],...vOctagon];
        var [x1, y1, x2, y2]=[Math.cos(Math.PI/8)/2, Math.sin(Math.PI/8)/2, Math.cos(3*Math.PI/8)/2, Math.sin(3*Math.PI/8)/2];
        var hOctagon=[[x1,y1],[x2,y2],[-x1,y1],[-x2,y2],[-x1,-y1],[-x2,-y2],[x1,-y1],[x2,-y2]];
        var hCOctagon=[[0,0],...hOctagon];

        function scale(coords, offset, scaleF){
          var offset=offset||[0,0];
          var scale=scale||1;
          return coords.map(function(c){
            return [scaleF*c[0]+offset[0], scaleF*c[1]+offset[1]];
          });
        }

        //input
        var width=200;
        var height=200;
        var sites=vCSquare;
        //

        var [xc, yc] = [width/2, height/2];
        var scaleF=Geom.distPointToPoint([0,0],[width, height])/2;
        var closingPoints=[[-50,0],[50,0],[0,50],[0,-50]];
        var points=scale([...closingPoints,...sites], [xc,yc], scaleF);
        console.log(points);

        var v=new Voronoi(points);
        v.plotEdges();



})
