# Voronoi diagram in python
# Fortune's Algorithm in O(n*logn)

import numpy as np
import matplotlib.pyplot as plt
import time
from matplotlib import collections as mc
from matplotlib.patches import Polygon
from matplotlib.collections import PatchCollection
from matplotlib.cm import jet
from collections import defaultdict

import sys

class Ordering(object):

    def go_to_i(alist, elem, comparison):
        i = 0
        while i < len(alist) and comparison(elem, alist[i]):
            i += 1
        return i

    def is_coord_y_greater(elem1, elem2, approx=1.0e-10):
        return elem1.coord.y>elem2.coord.y+approx


class Point(object):

    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __eq__(self, other):
        return isinstance(other, Point) and self.x==other.x and self.y==other.y

    def __hash__(self):
        return hash(str(self))

    def dist_to_point(self, p):
        return np.sqrt(np.power(self.x - p.x, 2) + np.power(self.y - p.y, 2))

    def dist_to_par(self, focus):
        return np.power(self.dist_to_point(focus), 2)/(2*abs(self.y-focus.y)) if self.dist_to_point(focus)!=0 else np.inf


class Circle():

    def center(a, b, c):
        d = (a.x - c.x) * (b.y - c.y) - (b.x - c.x) * (a.y - c.y)
        if d==0:
            return Point(np.inf, np.inf)
        xc=(((a.x-c.x)*(a.x+c.x)+(a.y-c.y)*(a.y+c.y))/2*(b.y-c.y)-((b.x-c.x)*(b.x+c.x)+(b.y-c.y)*(b.y+c.y))/2*(a.y-c.y))/d
        yc=(((b.x-c.x)*(b.x+c.x)+(b.y-c.y)*(b.y+c.y))/2*(a.x-c.x)-((a.x-c.x)*(a.x+c.x)+(a.y-c.y)*(a.y+c.y))/2*(b.x-c.x))/d
        return Point(xc,yc)


class Parabol():

    def cross_x(f1, f2, q):
        if f1.y!=f2.y:
            s1=(f1.y*f2.x-f1.x*f2.y+f1.x*q-f2.x*q+np.sqrt((f1.x*f1.x+f1.y*f1.y-2*f1.x*f2.x+f2.x*f2.x-2*f1.y*f2.y+f2.y*f2.y)*(f1.y*f2.y-f1.y*q-f2.y*q+q*q)))/(f1.y-f2.y)
            s2=(f1.y*f2.x-f1.x*f2.y+f1.x*q-f2.x*q-np.sqrt((f1.x*f1.x+f1.y*f1.y-2*f1.x*f2.x+f2.x*f2.x-2*f1.y*f2.y+f2.y*f2.y)*(f1.y*f2.y-f1.y*q-f2.y*q+q*q)))/(f1.y-f2.y)
            return (s1, s2) if s1<s2 else (s2, s1)
        else:
            return ((f1.x+f2.x)/2, (f1.x+f2.x)/2)


class Segment(object):

    def __init__(self,  pl=None, pr=None, start=None, end=None):
        self.start=start
        self.end=end
        self.pl=pl
        self.pr=pr
        self.m=np.inf if self.pl.y==self.pr.y else -(self.pl.x-self.pr.x)/(self.pl.y-self.pr.y)
        self.hp=1 if self.pl.x<self.pr.x or (self.pl.x==self.pr.x and self.pl.y>self.pr.y) else -1 #halfplane
        self.vec=Point(1,self.m) if (self.hp*self.m>0 or (self.m==0 and self.hp>0)) else Point(-1,-self.m) #vector

    def does_intersect(self, s1, s2=None, approx=1.0e-10):
        s2=self if s2==None else s2
        (dx, dy) = (s2.start.x - s1.start.x, s2.start.y - s1.start.y)
        if s2.m==np.inf:
            return True if s2.hp*(s1.m*dx-dy)>=-approx and s1.vec.x*dx>=-approx else False
        if s1.m==np.inf:
            return True if s1.hp*(s2.m*dx-dy)<=approx and s2.vec.x*dx<=approx else False
        det=s2.vec.x*s1.vec.y-s2.vec.y*s1.vec.x
        if det==0:
            return False
        (u,v)=((dy*s2.vec.x-dx*s2.vec.y)/det,(dy*s1.vec.x-dx*s1.vec.y)/det)
        return True if (u>=-approx and v>=approx) or (u>=approx and v>=-approx) else False


class Tree(object):

    def __init__(self, item=None, parent=None, l=None, r=None):
        self.item=item
        self.parent=parent
        self.l=l
        self.r=r

    def is_root(self):
        return self.parent==None

    def is_leaf(self):
        return self.l==None

    def is_lchild(self):
        return not self.is_root() and self.parent.l==self

    def is_rchild(self):
        return not self.is_root() and self.parent.r==self

    def add_rchild(self, child, event=None):
        self.r=child
        child.parent=self

    def add_lchild(self, child, event=None):
        self.l=child
        child.parent=self

    def get_lleaf_and_lparent(self, leaf=None):
        cur_node=self if leaf==None else leaf
        while cur_node.is_lchild():
            cur_node=cur_node.parent
        if cur_node.is_root():
            return None, None
        lparent=cur_node.parent
        cur_node=cur_node.parent.l
        while not cur_node.is_leaf():
            cur_node=cur_node.r
        return cur_node, lparent

    def get_rleaf_and_rparent(self, leaf=None):
        cur_node=self if leaf==None else leaf
        while cur_node.is_rchild():
            cur_node=cur_node.parent
        if cur_node.is_root():
            return None, None
        rparent=cur_node.parent
        cur_node=cur_node.parent.r
        while not cur_node.is_leaf():
            cur_node=cur_node.l
        return cur_node, rparent


class Beachline(Tree):

    def __init__(self, item=None, parent=None, l=None, r=None, c_event=None):
        super().__init__(item, parent, l, r)
        self.c_event=c_event

    def get_arc_node_on_site(self, new_site):
        cur_node=self
        while isinstance(cur_node.item, Segment):
            sol=0 if cur_node.item.pl.y<cur_node.item.pr.y else 1
            cur_node=cur_node.l if new_site.x<(Parabol.cross_x(cur_node.item.pl, cur_node.item.pr, new_site.y)[sol]) else cur_node.r
        return cur_node

    def add_arc(self, new_arc_site, arc_nodes):
        (larc_node, crossed_arc_node, rarc_node)=arc_nodes
        crossed_arc_site=crossed_arc_node.item
        cross_point = Point(new_arc_site.x, new_arc_site.y-new_arc_site.dist_to_par(crossed_arc_site))
        new_lhalfedge=Segment(pl=crossed_arc_site, pr=new_arc_site, start=cross_point)
        new_rhalfedge=Segment(pl=new_arc_site, pr=crossed_arc_site, start=cross_point)
        crossed_arc_node.item = new_lhalfedge
        crossed_arc_node.add_lchild(Beachline(crossed_arc_site))
        crossed_arc_node.add_rchild(Beachline(new_rhalfedge))
        crossed_arc_node.r.add_lchild(Beachline(new_arc_site))
        crossed_arc_node.r.add_rchild(Beachline(crossed_arc_site))
        if larc_node!=None and larc_node.c_event!=None:
            larc_node.c_event.arcs_nodes[2]=crossed_arc_node.l
        if rarc_node!=None and rarc_node.c_event!=None:
            rarc_node.c_event.arcs_nodes[0]=crossed_arc_node.r.r

    def rm_arc(self, new_edge_start, arcs_nodes, edges_nodes):
        (live_larc_node, dead_arc_node, live_rarc_node)=arcs_nodes
        if dead_arc_node.is_rchild():
            (live_cut_branch, mid_edge_node, top_edge_node)=(edges_nodes[0].l, edges_nodes[0], edges_nodes[1])
        else:
            (live_cut_branch, mid_edge_node, top_edge_node)=(edges_nodes[1].r, edges_nodes[1], edges_nodes[0])
        top_edge_node.item = Segment(pl=live_larc_node.item, pr=live_rarc_node.item, start=new_edge_start, end=None)
        if mid_edge_node.is_rchild():
            mid_edge_node.parent.r=live_cut_branch
        else:
            mid_edge_node.parent.l=live_cut_branch
        live_cut_branch.parent=mid_edge_node.parent


class Event(object):

    def __init__(self, arc_site_or_nodes):
        if isinstance(arc_site_or_nodes, Point):
            self.coord=arc_site_or_nodes
            self.arcs_nodes=None
        else:
            self.arcs_nodes=[arc_site_or_nodes[0], arc_site_or_nodes[2], arc_site_or_nodes[4]]
            self.edges_nodes=[arc_site_or_nodes[1], arc_site_or_nodes[3]]
            self.vertex_coord=Circle.center(self.arcs_nodes[0].item, self.arcs_nodes[1].item, self.arcs_nodes[2].item)
            self.coord=Point(self.vertex_coord.x,self.vertex_coord.y+self.arcs_nodes[0].item.dist_to_point(self.vertex_coord))

    def __eq__(self, e):
        return isinstance(e, Event) and self.arcs_nodes==e.arcs_nodes and self.coord==e.coord

    def add(self, es):
        i=Ordering.go_to_i(es, self, Ordering.is_coord_y_greater)
        es.insert(i, self)

    def rm(self, es):
        i=Ordering.go_to_i(es, self, Ordering.is_coord_y_greater)
        while True:
            if i==len(es)-1 or self.coord.y != es[i+1].coord.y or self==es[i]:
                return es.pop(i)
            i+=1


class Voronoi(object):

    def __init__(self, sites):
        self.sites=sites  #siti di V, obj Point
        self.events=[]
        self.iterations=0 #inserito per il calcolo delle iterazioni, ma non necessario alla creazione del diagramma
        for site in sites:
            Event(site).add(self.events)
        self.beach=Beachline()
        self.edges=[]

    def rm_circle_event(self, arc_node):
        if arc_node.c_event != None:
            arc_node.c_event.rm(self.events)
            arc_node.c_event = None

    def add_circle_event(self, arc_node, sweep_y, approx=1.0e-10):
        larc_node, ledge_node = arc_node.get_lleaf_and_lparent()
        rarc_node, redge_node = arc_node.get_rleaf_and_rparent()
        if larc_node==None or rarc_node==None or larc_node.item==rarc_node.item or not ledge_node.item.does_intersect(redge_node.item):
            return
        cc = Circle.center(larc_node.item, arc_node.item, rarc_node.item)
        if cc.y==np.inf:
            return
        event_coord=Point(cc.x, cc.y+arc_node.item.dist_to_point(cc))
        if event_coord.y<sweep_y-approx:
            return
        arc_node.c_event=Event([larc_node, ledge_node, arc_node, redge_node, rarc_node])
        arc_node.c_event.add(self.events)

    def manage_site_event(self):
        event=self.events.pop(0)
        crossed_arc_node=self.beach.get_arc_node_on_site(event.coord)
        larc_node=crossed_arc_node.get_lleaf_and_lparent()[0]
        rarc_node=crossed_arc_node.get_rleaf_and_rparent()[0]
        self.rm_circle_event(crossed_arc_node)
        self.beach.add_arc(event.coord, (larc_node, crossed_arc_node, rarc_node))
        self.add_circle_event(crossed_arc_node.l, event.coord.y)
        self.add_circle_event(crossed_arc_node.r.r, event.coord.y)

    def manage_circle_event(self):
        event=self.events.pop(0)
        (dead_edgeA, dead_edgeB)=(event.edges_nodes[0].item, event.edges_nodes[1].item)
        (dead_edgeA.end, dead_edgeB.end)=(event.vertex_coord, event.vertex_coord)
        self.beach.rm_arc(event.vertex_coord, event.arcs_nodes, event.edges_nodes)
        self.edges.append(dead_edgeA)
        self.edges.append(dead_edgeB)
        self.rm_circle_event(event.arcs_nodes[0])
        self.rm_circle_event(event.arcs_nodes[2])
        self.add_circle_event(event.arcs_nodes[0], event.coord.y)
        self.add_circle_event(event.arcs_nodes[2], event.coord.y)

    def run(self):
        self.beach.item=self.events.pop(0).coord
        self.iterations+=1
        while self.events!=[]:
            self.manage_site_event() if self.events[0].arcs_nodes==None else self.manage_circle_event()
            self.iterations+=1

    def plot_edges(self, x_range, y_range, file_name="voronoi_script_edges.png"):
        self.run()
        lines = [[(edge.start.x, edge.start.y),(edge.end.x, edge.end.y)] for edge in self.edges]
        lc = mc.LineCollection(lines)
        fig, ax = plt.subplots()
        ax.axis([*x_range, *y_range])
        ax.add_collection(lc)
        ax.margins(0.1)
        xs, ys = zip(*[[p.x,p.y] for p in self.sites])
        ax.plot(xs, ys, 'ro')
        fig.savefig(file_name)

    def plot_patches(self, x_range, y_range, file_name="voronoi_script_patches.png"):
        self.run()
        pts = self.sites
        pts_dict = defaultdict(list)
        patches = []
        colors = []
        for edge in self.edges:
            pts_dict[edge.pl].append((edge.start, edge.end))
            pts_dict[edge.pr].append((edge.start, edge.end))
        for center, v_raw in pts_dict.items():
            starts, ends = zip(*v_raw)
            vertices = set(starts + ends)
            vertices = sorted(vertices, key=lambda p: np.arctan2(p.y-center.y,p.x-center.x))
            vertices = [(v.x, v.y) for v in vertices]
            patches.append(Polygon(vertices, True))
            colors.append(center.dist_to_point(Point(0,0)))
        fig, ax = plt.subplots()
        colors = 100*np.random.rand(len(patches))
        pc = PatchCollection(patches, cmap=jet, alpha=0.2)
        pc.set_array(np.array(colors))
        ax.axis([*x_range, *y_range])
        ax.add_collection(pc)
        ax.margins(0.1)
        xs, ys = zip(*[(p.x, p.y) for p in pts])
        ax.plot(xs, ys, 'ro', markersize=1)
        fig.savefig(file_name)

def main(argv=sys.argv):
    #(script_name, sites, x_range, y_range) = argv
    sites=[Point(0,0), Point(1,1)]
    x_range, y_range = ((-4,4),(-4,4))
    time0 = time.time()
    (xm, ym)=((x_range[1]-x_range[0])/2, (y_range[1]-y_range[0])/2)
    diag=np.sqrt(np.power(x_range[1]-x_range[0], 2) + np.power(y_range[1]-y_range[0], 2))
    closing_points=[Point(xm, y_range[0]-diag), Point(x_range[1]+diag, ym), Point(xm, y_range[1]+diag), Point(x_range[0]-diag, ym)]
    v=Voronoi(sites+closing_points)
    time1=time.time()
    v.plot_patches(x_range, y_range)
    time1=time.time()
    print("Ended. It took %.4f seconds and %s iterations" % (time1-time0, v.iterations))

if __name__ == "__main__":
    sys.exit(main())
