#Voronoi JS

This application draws on a canvas the Voronoi diagram of a given set of points.

The [Voronoi diagram](https://en.wikipedia.org/wiki/Voronoi_diagram) of a set of points (called *sites*, *seeds*) is a tessellation of the plane. Each cell of the tessellation is the locus of points that are closer to a specific site than to the other sites.
Paths.js computes the Voronoi diagram of a given set of sites using the Euclidean metric to measure the distance between points. The algorithm used for the computation is the [Fortune's algorithm](https://en.wikipedia.org/wiki/Fortune's_algorithm), which is characterized by *O*(*n* \* *log(n)*) complexity. Four points are added to the given input sites for the purpose of visualization. These points are placed sufficiently far from the given input sites in order not to affect the portion of the plot that is shown.

In order to get the Voronoi diagram of the desired set of point:

1. open the voronoi_JS/scripts/main.js file and edit the following fields:

  * `xrange`, `yrange`: the ranges of the x and y axis shown by the plot.
  * `width`, `height`: the desired width and height of the plot in terms of pixels.
  * `data`: array of arrays. Each inner array contains two numbers and will be a site of the computed Voronoi diagram.

2. open the voronoi_JS/index.html
