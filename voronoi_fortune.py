# Voronoi diagram in python
# Fortune's Algorithm in O(n*logn)

import numpy as np
from matplotlib import collections as mc
import matplotlib.pyplot as plt
from collections import defaultdict
import time

import sys

def go_to_i(alist, apoint, comparison):
    i = 0
    while i < len(alist) and comparison(alist[i], apoint):
        i += 1
    return i

class Ordering():
    def event_y(e1, e2):
        return e1.coord.y < e2.coord.y

class Circle():
    def center(a, b, c):
        d = (a.x - c.x) * (b.y - c.y) - (b.x - c.x) * (a.y - c.y)
        if d==0:
            return Point(np.inf, np.inf)
        xc = (((a.x - c.x) * (a.x + c.x) + (a.y - c.y) * (a.y + c.y)) / 2 *
              (b.y - c.y) - ((b.x - c.x) * (b.x + c.x) + (b.y - c.y) * (b.y + c.y)) / 2 *
              (a.y - c.y))/d
        yc = (((b.x - c.x) * (b.x + c.x) + (b.y - c.y) * (b.y + c.y)) / 2 *
              (a.x - c.x) - ((a.x - c.x) * (a.x + c.x) + (a.y - c.y) * (a.y + c.y)) / 2 *
              (b.x - c.x))/d
        return Point(xc, yc)

    def bottom(a, b, c):
        cc = Circle.center(a, b, c)
        return Point(cc.x, cc.y-cc.dist_to_point(a))

    def top(a, b, c):
        cc = Circle.center(a, b, c)
        return Point(cc.x, cc.y+cc.dist_to_point(a))

class Parabol():
    def arc_cross_x(f1, f2, q):
        if f1.y!=f2.y:
            s1=(f1.y*f2.x-f1.x*f2.y+f1.x*q-f2.x*q+np.sqrt((f1.x*f1.x+f1.y*f1.y-2*f1.x*f2.x+f2.x*f2.x-2*f1.y*f2.y+f2.y*f2.y)*(f1.y*f2.y-f1.y*q-f2.y*q+q*q)))/(f1.y-f2.y)
            s2=(f1.y*f2.x-f1.x*f2.y+f1.x*q-f2.x*q-np.sqrt((f1.x*f1.x+f1.y*f1.y-2*f1.x*f2.x+f2.x*f2.x-2*f1.y*f2.y+f2.y*f2.y)*(f1.y*f2.y-f1.y*q-f2.y*q+q*q)))/(f1.y-f2.y)
            return [s1, s2] if s1<s2 else [s2, s1]
        else:
            return [(f1.x+f2.x)/2, (f1.x+f2.x)/2]

    def y(f, q):
        def y(x):
            if q!=f.y:
                return np.power((x - f.x),2)/(2*(abs(q-f.y)))+(q-f.y)/2
            else:
                return np.inf
        return y

class Point(object):
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.pair = (x,y)

    def __str__(self):
        return "(%.2f,%.2f)" % (self.x,self.y)

    def __repr__(self):
        return str(self)

    def __eq__(self, other):
        return other != None and self.x == other.x and self.y == other.y

    def is_x_greater(self, p):
        return self.x > p.x

    def is_y_greater(self, p):
        return self.y > p.y

    def delta_x(self, p):
        return self.x-p.x

    def delta_y(self, p):
        return self.y-p.y

    def dist_to_point(self, p):
        return np.sqrt(np.power(self.x - p.x, 2) + np.power(self.y - p.y, 2))

    def dist_to_par(self, focus):
        return np.power(self.dist_to_point(focus), 2)/(2*abs(self.delta_y(focus))) if self.delta_y(focus)!=0 else np.inf

    def is_same_point(self, p):
        return self.x == p.x and self.y == p.y

    def is_in(self, ps):
        for p in ps:
            if self.is_same_point(p):
                return True
        return False

class Segment(object):

    def __init__(self,  pl=None, pr=None, start=None, end=None):
        self.start = start #punto iniziale del segmento
        self.end = end #punto finale del segmento
        self.pl = pl #uno dei due punti di cui l'oggetto è un segmento dell'asse
        self.pr = pr #uno dei due punti di cui l'oggetto è un segmento dell'asse

    def __str__(self):
        start = "None" if self.start==None else self.start
        end = "None" if self.end==None else self.end
        lf = self.pl
        rf =self.pr
        return "(%s -> %s, left focus %s, right focus %s)" % (start, end, lf, rf)

    def __repr__(self):
        return str(self)

    def halfplane(self):
        if self.pl.x<self.pr.x: #semipiano superiore
            return 2
        if self.pl.x>self.pr.x: #semipiano inferiore
            return -2
        if self.pl.x==self.pr.x and self.pl.y>self.pr.y: #asse x+
            return 1
        return -1 #asse x-

    def m(self): #y=mx+q ; m=-(pl.x-pr.x)/(pl.y-pr.y) ; q=(pl.y+pr.y)/2-m*(pl.x+pr.x)/2
        return np.inf if self.pl.y==self.pr.y else -(self.pl.x-self.pr.x)/(self.pl.y-self.pr.y)

    def direction(self):
        (m, hp)=(self.m(), self.halfplane())
        return Point(1,m) if (hp*m>0 or (m==0 and hp>0)) else Point(-1,-m)

    def theta(self, rad=False):
        theta = round(np.arctan2(self.direction().y, self.direction().x), 3)
        return round(theta*180/np.pi, 2) if rad==False else round(theta, 3)

    def y(self, x):
        return self.m()*x+self.start.y-self.m()*self.start.x

    def get_intersection(self, s1, s2=None):
        if s2 == None:
            s2 = self
        (s1_m, s2_m)=(s1.m(), s2.m())
        (s1_hp, s2_hp)=(s1.halfplane(), s2.halfplane())
        if (s1_hp*s1_m>0 or (s1_m==0 and s1_hp>0)): #semiretta semipiano dx
            s1_vec=Point(1,s1_m)
        else: #semiretta nel semipiano sx
            s1_vec=Point(-1,-s1_m)
        if (s2_hp*s2_m>0 or (s2_m==0 and s2_hp>0)): #semiretta semipiano dx
            s2_vec=Point(1,s2_m)
        else: #semiretta nel semipiano sx
            s2_vec=Point(-1,-s2_m)
        dx = s2.start.x - s1.start.x
        dy = s2.start.y - s1.start.y
        if s2_m==np.inf:
            if s2_hp*(s1_m*dx-dy)>=-1.0e-10 and s1_vec.x*dx>=-1.0e-10:
                return Point(s2.start.x, s1.start.y+s1_m*(dx))
            return None
        if s1_m==np.inf:
            if s1_hp*(s2_m*dx-dy)<=1.0e-10 and s2_vec.x*dx<=1.0e-10:
                return Point(s1.start.x, s2.start.y-s2_m*(dx))
            return None
        det = s2_vec.x * s1_vec.y - s2_vec.y * s1_vec.x
        if det==0:
            return None
        u = (dy * s2_vec.x - dx * s2_vec.y) / det
        v = (dy * s1_vec.x - dx * s1_vec.y) / det
        if (u>=-1e-10 and v>=1e-10) or (u>=1e-10 and v>=-1e-10):
            return Point(s1.start.x+u*s1_vec.x, s1.start.y+u*s1_vec.y)

class Beachline(object):

    def __init__(self, item):
        self.item = item
        self.parent = None
        self.l = None
        self.r = None
        self.c_event=None

    def str_node(self, directions=[]):
        cur_node=self
        for d in directions:
            cur_node=cur_node.l if d=="l" else cur_node.r
        if isinstance(cur_node.item, Segment):
            return "Edge. "+str(cur_node.item)
        else:
            if cur_node.c_event==None:
                return "Arc. "+str(cur_node.item)+". Circle event: None"
            else:
                return "Arc. "+str(cur_node.item)+". Event: "+cur_node.c_event.str_event()

    def str_tree(self, path="Path: root"):
        node_string=path+". "+self.str_node()+"\n"
        if not self.is_leaf():
            node_string+=self.l.str_tree(path+"->l")
            node_string+=self.r.str_tree(path+"->r")
        return node_string

    def get_leaves(self):
        cur_node=self
        leaves=[]
        while not cur_node.is_leaf():
            cur_node=cur_node.l
        while cur_node!=None:
            leaves.append(cur_node)
            cur_node=cur_node.get_rleaf_and_rparent()[0]
        return leaves

    def is_leaf(self):
        return self.l==None

    def is_lchild(self):
        return not self.is_root() and self.parent.l==self

    def is_rchild(self):
        return not self.is_root() and self.parent.r==self

    def is_root(self):
        return self.parent==None

    def add_rchild(self, item, event=None):
        child = Beachline(item)
        child.parent = self
        self.r = child

    def add_lchild(self, item, event=None):
        child = Beachline(item)
        child.parent = self
        self.l = child
        
    def get_nearest_arc_node_by_x(self, new_site):
        if self.item==None: #beachline vuota. In tal caso non esiste un sito più vicino
            return None
        else:
            cur_node=self
        while isinstance(cur_node.item, Segment): #essendo al primo passaggio, siteA.x!=siteB.x, per ogni sito
            cur_node=cur_node.l if new_site.x<(cur_node.item.pl.x+cur_node.item.pr.x)/2 else cur_node.r

    def get_arc_node_on_site(self, new_site):
        cur_node = self
        while isinstance(cur_node.item, Segment):
            if cur_node.item.pl.y<cur_node.item.pr.y:
                sol=0
            else:
                sol=1
            cur_node = cur_node.l if new_site.x<(Parabol.arc_cross_x(cur_node.item.pl, cur_node.item.pr, new_site.y)[sol]) else cur_node.r
        return cur_node

    def get_lleaf_and_lparent(self, leaf=None):
        cur_node=self if leaf==None else leaf
        while cur_node.is_lchild():
            cur_node=cur_node.parent
        if cur_node.is_root():
            return [None,None]
        ledge=cur_node.parent
        cur_node=cur_node.parent.l
        while not cur_node.is_leaf():
            cur_node=cur_node.r
        return cur_node, ledge

    def get_rleaf_and_rparent(self, leaf=None):
        cur_node=self if leaf==None else leaf
        while cur_node.is_rchild():
            cur_node=cur_node.parent
        if cur_node.is_root():
            return [None, None]
        redge=cur_node.parent
        cur_node=cur_node.parent.r
        while not cur_node.is_leaf():
            cur_node=cur_node.l
        return cur_node, redge
    
    def add_start_arc(self, new_arc_site, nearest_arc_node=None): 
        if nearest_arc_node==None:
            self.item=new_arc_site
            return
        nearest_arc_site=nearest_arc_node.item
        if new_arc_site.x<nearest_arc_site.x:
            top_updated_edge_node=nearest_arc_node.get_lleaf_and_lparent()[1]
            if top_updated_edge_node!=None:
                top_updated_edge_node.item.pr=new_arc_site
                top_updated_edge_node.item.start.x=(new_arc_site.x+top_updated_edge_node.item.pl.x)/2
            new_edge=Segment(pl=new_arc_site, pr=nearest_arc_site, start=Point((new_arc_site.x+nearest_arc_site.x)/2, -math.inf))
            nearest_arc_node.item=new_edge
            nearest_arc_node.add_lchild(new_arc_site)
            nearest_arc_node.add_rchild(nearest_arc_site)
        else:
            top_updated_edge_node=nearest_arc_node.get_rleaf_and_rparent()[1]
            if top_updated_edge_node!=None:
                top_updated_edge_node.item.pl=new_arc_site
                top_updated_edge_node.item.start.x=(new_arc_site.x+top_updated_edge_node.item.pr.x)/2
            new_edge=Segment(pl=nearest_arc_site, pr=new_arc_site, start=Point((new_arc_site.x+nearest_arc_site.x)/2, -math.inf))
            nearest_arc_node.item=new_edge
            nearest_arc_node.add_rchild(new_arc_site)
            nearest_arc_node.add_lchild(nearest_arc_site)

    def add_arc(self, new_arc_site, crossed_arc_node):
        crossed_arc_site = crossed_arc_node.item
        cross_point = Point(new_arc_site.x, new_arc_site.y-new_arc_site.dist_to_par(crossed_arc_site))
        new_lhalfedge=Segment(pl=crossed_arc_site, pr=new_arc_site, start=cross_point)
        new_rhalfedge=Segment(pl=new_arc_site, pr=crossed_arc_site, start=cross_point)
        crossed_arc_node.item = new_lhalfedge
        crossed_arc_node.add_lchild(crossed_arc_site)
        crossed_arc_node.add_rchild(new_rhalfedge)
        crossed_arc_node.r.add_lchild(new_arc_site)
        crossed_arc_node.r.add_rchild(crossed_arc_site)

    def rm_arc(self, new_edge_start, arcs_nodes, edges_nodes):
        (live_larc_node, dead_arc_node, live_rarc_node)=(arcs_nodes[0], arcs_nodes[1], arcs_nodes[2])
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
            self.coord = arc_site_or_nodes
            self.arcs_nodes = None
        else:
            self.arcs_nodes=[arc_site_or_nodes[0], arc_site_or_nodes[2], arc_site_or_nodes[4]]
            self.edges_nodes=[arc_site_or_nodes[1], arc_site_or_nodes[3]]
            self.vertex_coord=Circle.center(self.arcs_nodes[0].item, self.arcs_nodes[1].item, self.arcs_nodes[2].item)
            self.coord=Point(self.vertex_coord.x,self.vertex_coord.y+self.arcs_nodes[0].item.dist_to_point(self.vertex_coord))

    def __str__(self):
        if self.arcs_nodes==None:
            return "Site event: " + str(self.coord)
        else:
            return "Circle event. Tangent: "+str(self.coord)+". Ref: "+ str(self.arcs_nodes[1].item)

    def is_same_event(self, e):
        return self.arcs_nodes==e.arcs_nodes and self.coord==e.coord

    def is_coord_y_greater(self, e):
        return self.coord.y > e.coord.y+1e-10

    def add(self, es):
        i = go_to_i(es, self, Ordering.event_y)
        es.insert(i, self)

    def rm(self, es):
        i = go_to_i(es, self, Ordering.event_y)
        while True:
            if i==len(es)-1 or self.coord.y != es[i+1].coord.y or self.is_same_event(es[i]):
                return es.pop(i)
            i+=1

class Voronoi(object):

    def __init__(self, sites):
        self.sites = sites
        self.edges = []
        self.events = []
        self.iterations = 0
        for site in sites:
            Event(site).add(self.events)
        self.beach = Beachline(self.events[0].coord)

    def rm_circle_event(self, arc_node):
        if arc_node.c_event != None:
            arc_node.c_event.rm(self.events)
            arc_node.c_event = None

    def add_circle_event(self, arc_node, sweep_y):
        larc_node = arc_node.get_lleaf_and_lparent()[0]
        rarc_node = arc_node.get_rleaf_and_rparent()[0]
        ledge_node = arc_node.get_lleaf_and_lparent()[1]
        redge_node = arc_node.get_rleaf_and_rparent()[1]
        if larc_node==None or rarc_node==None:
            return "No event: first or last arc"
        if larc_node.item.is_same_point(rarc_node.item):
            return "No event: lefter arc site equals righter arc site"
        cc = Circle.center(larc_node.item, arc_node.item, rarc_node.item)
        if cc.y==np.inf:
            return "No event: the three arcs sites are on the same line"
        event_point=Point(cc.x, cc.y+arc_node.item.dist_to_point(cc))
        if event_point.y<sweep_y-1e-10:
            return "No event: circle event coordinate below sweepline"
        if ledge_node.item.get_intersection(redge_node.item)==None:
            return "Edges do not cross"
        arc_node.c_event = Event([larc_node, ledge_node, arc_node, redge_node, rarc_node])

        arc_node.c_event.add(self.events)
        return arc_node.c_event
    
    def manage_start_site_event(self):
        event=self.events.pop(0)
        self.beach.add_start_arc(event.coord, self.beach.get_nearest_arc_node_by_x(event.coord))

    def manage_site_event(self):
        event=self.events.pop(0)
        crossed_arc_node = self.beach.get_arc_node_on_site(event.coord)
        rarc_node=crossed_arc_node.get_rleaf_and_rparent()[0]
        larc_node=crossed_arc_node.get_lleaf_and_lparent()[0]
        self.rm_circle_event(crossed_arc_node)
        if larc_node != None:
            self.rm_circle_event(larc_node)
        if rarc_node != None:
            self.rm_circle_event(rarc_node)
        self.beach.add_arc(event.coord, crossed_arc_node)
        if larc_node != None:
            self.add_circle_event(larc_node, event.coord.y)
        if rarc_node != None:
            self.add_circle_event(rarc_node, event.coord.y)
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
        event_number = []
        self.events.pop(0)
        self.iterations += 1

        while self.events != []:
            self.iterations += 1
            if self.events[0].arcs_nodes==None:
                self.manage_site_event()
            else:
                self.manage_circle_event()
        return self

    def plot(self, xrange=(-2,2), yrange = (-2,2), file_name="voronoi.png"):
        v1 = self.run()
        lines = [[(edge.start.x, edge.start.y),(edge.end.x, edge.end.y)] for edge in v1.edges]
        lc = mc.LineCollection(lines)
        fig, ax = plt.subplots()
        ax.axis([*xrange, *yrange])
        ax.add_collection(lc)
        ax.margins(0.1)
        xs, ys = zip(*[[p.x,p.y] for p in v1.sites])
       
    def run(self):
        first_y=self.events[0].coord.y
        self.iterations+=1
        while self.events!=[] and self.events[0].coord.y==first_y:
            self.manage_start_site_event()
            self.iterations+=1
        while self.events!=[]:
            self.manage_site_event() if self.events[0].arcs_nodes==None else self.manage_circle_event()
            self.iterations+=1

    def plot(self, x_range=(-2,2), y_range = (-2,2), file_name="voronoi.png"):
        self.run()
        lines = [[(edge.start.x, edge.start.y),(edge.end.x, edge.end.y)] for edge in self.edges]
        lc = mc.LineCollection(lines)
        fig, ax = plt.subplots()
        ax.axis([*x_range, *y_range])
        ax.add_collection(lc)
        ax.margins(0.1)
        xs, ys = zip(*[[p.x,p.y] for p in self.sites])

    def get_patches(self, xrange=(-2,2), yrange = (-2,2)):
        v1 = self.run()
        ps = self.sites
        ps_dict = defaultdict(list)
        for edge in v1.edges:
            ps_dict[edge.pl].append((edge.start, edge.end))
            ps_dict[edge.pr].append((edge.start, edge.end))
        print(ps_dict)

        
def main(argv=sys.argv):
    xs = np.random.uniform(-2, 2, 100)
    ys = np.random.uniform(-2, 2, 100)
    points = [Point(x, y) for x, y in zip(xs, ys)]
    print("started")
    time0 = time.time()
    v1 = Voronoi(points)
    #v1.get_patches()
    v1.plot(file_name="test.png")
    time1 = time.time()
    print("ended")
    print("it took %.4f seconds and %s iterations" % (time1 - time0, v1.iterations))


if __name__ == "__main__":
    sys.exit(main())
