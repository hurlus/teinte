/**
<h1>Tree, automatic table of contents and other tools for clickable trees</h1>


LGPL http://www.gnu.org/licenses/lgpl.html
© 2005 Frederic.Glorieux@fictif.org et École nationale des chartes
© 2012 Frederic.Glorieux@fictif.org
© 2013 Frederic.Glorieux@fictif.org et LABEX OBVIL


<p>
Manage show/hide trees. No dependancies to a javascript library.
The HTML structure handled is a multilevel list with nested ul in li.
Relies the more as possible on CSS, and toggles between
classes, especially to display groups of items (ul).
<b>li.plus</b> means there is more items inside (ul inside are hidden).
<b>li.minus</b> means it's possible to hide items inside.
First usecase is to generate an autotoc on the header hierarchy of HTML page.
All the events on such trees are also available for user written table of contents.
The method Tree.load() (to use on an body.onload() event) may be used to to add events
to all li.plus and li.minus.
</p>

<pre>
<body>

  <h1>Title of page</h1>
  ...
  <h2 id="header_id">1) header</h2>
  ...
  <h2>2) header</h2>
  ...

  <div id="nav ">
    <-- Generated by javascript -->
    <ul class="tree">
      <li class="plus"><a href="#h_1">Title of page</a>
        <ul>
          <li><a href="#header_id">1) header</a></li>
          <li><a href="#h_3">2) header</a></li>
        </ul>
      </li>
    </ul>
  </div>
  <!-- all li.plus and li.minus will become clickable -->
  <script src="../teipot/js/Tree.js">//</script>
</pre>



 */
if (!document.createElementNS) document.createElementNS = function(uri, name) {
  return document.createElement(name);
};



var Tree = {

  /** default class name for root ul */
  TREE: "tree",
  /** default class name for li with hidden list */
  MORE: "more",
  /** default class name for li with visible list */
  LESS: "less",
  /** default class name for clicked link */
  HERE: "here",
  /** default id where to find navigation pannel */
  ASIDE: "aside",
  /** the pannel element */
  aside: null,
  /** default id where to find titles */
  MAIN: "main",
  /** the main element */
  main: null,
  /** default id where to put an autotoc */
  TOC: "toc",

  /**
   * Ititialisation of the object
   */
  ini: function() {
    if (Tree.reLessmore) return;
    Tree.reLessmore=new RegExp(" *("+Tree.LESS+"|"+Tree.MORE+") *", "gi");
    Tree.reHere=new RegExp(" *("+Tree.HERE+") *", "gi");
    // case seems sometimes significant
    Tree.reHereDel=new RegExp(' *'+Tree.HERE+' *', "gi");
  },
  /**
   * Add basic css, possible to override
   */
  css: function() {
    if (!document) return;
    var css = document.createElementNS("http://www.w3.org/1999/xhtml", 'style');
    css.type = "text/css";
    css.innerHTML = "\
/* CSS for Javascript Tree.js */\
ol.tree, ul.tree, menu.tree { padding: 0; margin: 1em 0 1em 0; list-style: none; line-height: 105%; }\
.tree a { color: black; text-decoration: none; border-bottom: none; padding: 0 1ex 0 0; }\
.tree a:hover { color: gray; }\
.tree ol, .tree ul, .tree menu { list-style-type: none; padding: 0 0 0 0 ; margin: 2px 0 2px -9px; border-left: dotted 1px transparent; }\
.tree li { margin: 0; background-repeat: no-repeat; background-position: -1px 4px; list-style-image: none; list-style: none; padding: 1px 0 1px 18px ; border: 1px solid transparent; }\
.tree ol:hover, .tree ul:hover { border-left: dotted 1px #333; }\
.tree li.more, .tree li.less { cursor: default }\
.tree li:before { font-family: Arial, 'Liberation Sans', 'DejaVu Sans', 'FreeSans', 'Lucida Sans Unicode', sans-serif;  color: #666; margin-left: -2ex; float: left; }\
.tree li.more:before { content: '▶ '; } /* ► */\
.tree li.less:before { content: '▽ '; } /*  */\
.tree li:before { content: '○ '; font-weight: 900; color: #999; } /* '○' */\
/* treejs is a class set by Tree.js to ensure that hidden blocks could be seen with no js, this order is important */\
@media screen {\
  .treejs li.less ol , .treejs li.less ul { display: block; }\
  .treejs li.less > ol, .treejs li.less > ul { border-left: 1px dotted #FFF; }\
  .treejs li.more ol, .treejs li.more ul { display: none; }\
}\
@media print {\
  .tree li { margin-top: none; margin-bottom: none; border: none;}\
}\
.tree mark, .tree .mark, .tree .hi { background: transparent; padding-left: 2px; border-left: 4px #888888 solid; }\
li a.here { font-weight: bold; color: #000; }\
li.here { color: #000; background-color: #FFFFFF; border-top: 1px #E2DED0 solid; border-bottom: 1px #E2DED0 solid; }\
li.here mark { background: inherit; }\
";
    var head = document.getElementsByTagName('head')[0];

    head.insertBefore(css, head.firstChild);
  },
  /**
   * What can be done for document.onload
   */
  loaded:false,
  load: function(id, href) {
    if (Tree.loaded) return;
    Tree.css(); // add css for Tree
    if (!id || id.stopPropagation) id = Tree.ASIDE; // id maybe an Event
    el = document.getElementById(id);
    if (el) Tree.aside = el;
    if (Tree.aside) {
      els = Tree.aside.getElementsByClassName(Tree.TREE);
      for(var maxj = els.length, j=0; j < maxj ; j++) {
        Tree.treeprep(els[j]);
      }
    }
    // TODO
    var embed = document.getElementsByTagName('figcaption');
    for (var i = 0; i < embed.length; i++) Tree.embedprep(embed.item(i));

    Tree.main = document.getElementById(Tree.MAIN);
    if (!Tree.main) {
      var nl = document.getElementsByTagName('main');
      if (nl.count) Tree.main = nl[0];
    }
    Tree.loadFacs();

    // we have a scrolling pannel, try to record a scroll state
    if (Tree.aside && sessionStorage) {
      var asidescroll = sessionStorage.getItem("asidescroll");
      if (asidescroll) Tree.aside.scrollTop = asidescroll;
      // OK with unload ?
      if (window.addEventListener) window.addEventListener('unload', function(){ sessionStorage.setItem("asidescroll", Tree.aside.scrollTop); }, false);

    }
    // don’t work well on drag with Chrome
    // window.addEventListener("mousedown", function(){ window.ismousedown = true;  }, false);
    // window.addEventListener("mouseup", function(){ window.ismousedown = false; }, false);
    Tree.winresize();
    window.addEventListener("resize", Tree.winresize, false);
    Tree.loaded=true;
  },

  /**
   * Create events on image facs
   */
  loadFacs: function() {
    // links for images
    if (!Tree.aside) return;
    var nl = document.querySelectorAll("a.facs");
    for (var i=0, length = nl.length; i < length; i++) {
      if (i+1 < length) nl[i].next = nl[i+1];
      nl[i].innerHTML = '◄' + nl[i].innerHTML;
      nl[i].onclick = Tree.facs;
    }
    if (nl.length) {
      Tree.facsdiv = document.createElementNS("http://www.w3.org/1999/xhtml", 'div');
      Tree.facsimg = document.createElementNS("http://www.w3.org/1999/xhtml", 'img');
      Tree.facsclose = document.createElementNS("http://www.w3.org/1999/xhtml", 'a');
      Tree.facsdiv.appendChild(Tree.facsimg);
      Tree.facsdiv.appendChild(Tree.facsclose);
      Tree.facsclose.className = 'close';
      Tree.facsclose.innerHTML = '✖';
      Tree.facsclose.style.position = 'absolute';
      Tree.facsclose.style.display = 'none';
      Tree.facsclose.onclick = function() { this.parentNode.style.visibility = "hidden"; Tree.facsimg.src = ''; };
      document.getElementsByTagName("body")[0].appendChild(Tree.facsdiv);
      Tree.facsdiv.id = 'facsdiv';
      Tree.facsdiv.style.resize = 'both';
      Tree.facsdiv.setAttribute('draggable', 'true');
      Tree.facsdiv.style.position = 'absolute';
      Tree.facsdiv.style.visibility = 'hidden';
      Tree.facsdiv.style.zindex = '10';
      Tree.facsdiv.style.top = 0 + 'px';
      Tree.facsdiv.style.width = 300 + 'px';
      Tree.facsdiv.style.overflow = 'auto'; // Tree.facsclose.style.visibility = "hidden";
      Tree.facsdiv.closepos = function() {Tree.facsclose.style.top = (this.scrollTop + this.clientHeight - 25 - Tree.facsclose.offsetHeight) + "px"; Tree.facsclose.style.left = (this.scrollLeft + this.clientWidth - 25 - Tree.facsclose.offsetWidth) + "px";}
      Tree.facsdiv.onscroll = function() { Tree.facsclose.style.display = 'none'; this.closepos(); Tree.facsclose.style.display = 'inline-block';};
      Tree.facsdiv.onmouseover = function() { this.closepos(); Tree.facsclose.style.display = 'inline-block'; }
      Tree.facsdiv.onmouseout = function() { Tree.facsclose.style.display = 'none';}
      // suppress max-width ?
      // Tree.facsimg.onload = function() {if (this.parentNode.style.width) return; this.parentNode.style.width = this.width + 'px'; this.parentNode.style.height = '100%'; }
    }
  },
  asideresize: function() {
    if (this.lastWidth == this.offsetWidth) return;
    var diff = this.offsetWidth - this.lastWidth
    this.lastWidth = this.offsetWidth;
    var parent = Tree.aside.parentNode;
    var width = parent.offsetWidth + diff;
    while (parent) {
      if(parent.nodeName.toLowerCase() == 'body') break;
      parent.style.width = (width) + 'px';
      parent = parent.parentNode;
    }
    sessionStorage.setItem("asidewidth", this.offsetWidth);
  },
  /**
   * Resize left pannel
   */
  winresize: function() {
    if(!Tree.aside) return;
    var w=window,d=document,e=d.documentElement,b=d.getElementsByTagName('body')[0];
    w.x=w.innerWidth||e.clientWidth||g.clientWidth;
    w.y=w.innerHeight||e.clientHeight||g.clientHeight;
    if (window.x > 1024) {
      Tree.aside.style.resize = 'horizontal';
      Tree.aside.addEventListener('mousemove', Tree.asideresize, false);
      var asidewidth = sessionStorage.getItem("asidewidth");
      // no memory for short screen, chrome, impossible to reduce
      if (asidewidth && asidewidth < window.x && Tree.isfirefox) {
        if (!Tree.aside.offsetWidth) return; // problem in painting
        diff = asidewidth - Tree.aside.offsetWidth;
        var parent = Tree.aside.parentNode;
        var width = parent.offsetWidth + diff;
        while (parent) {
          if (parent.nodeName.toLowerCase() == 'body') break;
          parent.style.width = (width) + 'px';
          parent = parent.parentNode;
        }
        Tree.aside.style.width = asidewidth + 'px';
      }
      // Tree.aside.parentNode.style.maxWidth = 'none'; ?
    }
    // resize to shorter
    else {
      sessionStorage.removeItem("asidewidth");
      Tree.aside.removeEventListener('mousemove', Tree.asideresize, false);
      Tree.aside.style.resize = 'none';
      Tree.aside.style.width = '';
      var parent = Tree.aside.parentNode;
      while (parent) {
        if (parent.nodeName.toLowerCase() == 'body') break;
        parent.style.width = '';
        parent = parent.parentNode;
      }
    }
    w.lastx = w.x;
    w.lasty = w.y;
  },
  /**
   * React on click on page facs
   */
  facs: function() {
    if (!Tree.facsimg) return true;
    // nouveau click refermer
    if (Tree.facsimg.src == this.href) {
      Tree.facsimg.src = '';
      Tree.facsdiv.style.visibility = 'hidden';
      return false;
    }
    Tree.facsdiv.style.visibility = 'visible';
    var top = Tree.top(this);
    Tree.facsdiv.style.top = top + 'px';
    // next page facs link
    if (this.next) Tree.facsdiv.style.height = (Tree.top(this.next) + this.next.offsetHeight - top) + 'px';
    Tree.facsimg.src = this.href;
    return false;
  },
  /**
   * Get window possition of an element
   */
  top: function(node) {
    var top = 0;
    do {
      top += node.offsetTop;
      node = node.offsetParent;
    } while(node && node.tagName.toLowerCase() != 'body');
    return top;
  },
  /**
   * Autotoc on h1, h2...
   * This recursive function is quite tricky, be careful when change a line
   *
   * nav : element (or identifier) where to put the toc
   * doc : element (or identifier) where to grap hierarchical titles
   */
  autotoc: function(nav, main) {
    // en onload, FF passe l'événement
    if( nav && nav.stopPropagation) {
      nav=null;
      main=null;
    }
    // if nothing provide, try default
    if (!nav) nav=document.getElementById(Tree.TOC);
    if (!main) main=document.getElementById(Tree.MAIN);
    // nothing to do, go out
    if(!nav) return;
    // seems ids
    if (nav.nodeType != 1) nav=document.getElementById(nav);
    if(!nav) return;
    if (main && main.nodeType != 1) main=document.getElementById(main);
    if(!main) main=document.getElementsByTagName("body")[0];

    // seems there is already a toc, go out
    if (nav.getElementsByTagName("ul") || nav.getElementsByTagName("menu")) return false;

    // Get the list of headers <h>
    var hList = Tree.getElementsByTagRE(/\bH[1-9]\b/i, main);
    // if very few headers, go out
    if(hList.length < 3) return;
    // create the root element, and be sur to keep a hand on it
    var tree = document.createElementNS("http://www.w3.org/1999/xhtml", 'div');
    tree.className="autotoc "+Tree.TREE;
    // the current list to which append items
    var ul=tree;
    // current item
    var li;
    // current item
    var level=1;
    // number of level visible
    var level_plus=0;
    // loop on header
    for(var i=0; i < hList.length; ++i) {
      // the link
      var a = document.createElementNS("http://www.w3.org/1999/xhtml", 'a');
      // take id of header if available
      var id=hList[i].id;
      // if not, build an automatic id
      if (!id) {
        id="h_" + i;
        hList[i].id=id;
      }
      a.href="#"+id;
      // just the text of the header (without tags)
      if (hList[i].textContent) {
        a.textContent=hList[i].textContent;
      } else if (hList[i].innerText) {
        a.innerText=hList[i].innerText;
      }
      // Now build ul/li according to the level of the title
      var hn=Number(hList[i].nodeName.substring(1));
      // current level deeper than last one, inser a list in last item
      if (hn > level) {
        ul=document.createElementNS("http://www.w3.org/1999/xhtml", 'ul');
        // deeper than visible levels
        if (li && level > level_plus) li.className+=" " + Tree.MORE;
        // append list to last item
        if (li) li.appendChild(ul);
      }
      // current level higher than last one, catch the relevant list where to append item
      else if (hn < level) {
        for (var j=level - hn ; j> 0 ; j--) {
          if (ul && ul.parentNode && ul.parentNode.parentNode && ul.parentNode.parentNode.nodeName.toLowerCase() == "ul")
            ul=ul.parentNode.parentNode;
          else break;
        }
      }
      // changer le niveau courant
      level=hn;
      // container is a div, probably root h1
      if (ul.nodeName.toLowerCase() == 'div') {
        li=document.createElementNS("http://www.w3.org/1999/xhtml", 'header');
        // append link
        li.appendChild(a);
        // append current item in the right list level
        ul.appendChild(li);
        // add children list as sibling (not child)
        li=ul;
        continue;
      }

      // create current item
      li=document.createElementNS("http://www.w3.org/1999/xhtml", 'li');
      // add an event on all li to have a selected class effect
      li.onclick = function(e) {return Tree.click(this, e);}
      // set a class for header level
      li.className=li.className+" "+hList[i].nodeName.toLowerCase();
      // append link
      li.appendChild(a);
      // append current item in the right list level
      ul.appendChild(li);
    }
    // Attach the tree
    nav.appendChild(tree);
  },
  /**
   * Add events to a block with a corresp link to load content inside
   */
  embedprep: function(bibl) {
    if (!bibl) return false;
    if (bibl.nodeType != 1) bibl = document.getElementById(bibl);
    if (!bibl) return false;
    var src = bibl.getAttribute( "xml:base");
    if (!src) return;
    if (src.indexOf(".js", src.length - 3) !== -1) {
      bibl.className = bibl.className + " embedjs";
      bibl.onclick = function() {
        var id = 'id' + new Date().getMilliseconds();
        var div = document.createElementNS("http://www.w3.org/1999/xhtml", 'div');
        div.className = 'embed';
        div.id = id;
        this.parentNode.insertBefore(div, this.nextSibling);
        var js = document.createElementNS("http://www.w3.org/1999/xhtml", 'script');
        js.src = src + '?id=' + id;
        var head = document.getElementsByTagName('head')[0].appendChild(js);
        this.className = this.className.replace(/ *(more|less) */g, '') + ' less';
        this.onclick = function() {
          if (div.style.display == 'none') {
            this.className = this.className.replace(/ *(more|less) */g, '') + ' less';
            div.style.display = '';
          }
          else {
            div.style.display = 'none';
            this.className = this.className.replace(/ *(more|less) */g, '') + ' more';
          }
        }
      };
    }
  },
  /**
   * Add events to a a recursive list
   */
  treeprep: function(ul) {
    if (!ul) return false;
    if (ul.nodeType != 1) ul = document.getElementById(ul);
    if (!ul) return false;
    if (ul.className.indexOf("tree") == -1) return false;
    var nodeset = ul.getElementsByTagName("li");
    for(var i=0; i < nodeset.length; i++) {
      target="";
      li=nodeset[i];
      // if item as children, hide them
      if (li.getElementsByTagName("ul").length && li.className.search(Tree.reLessmore)==-1) {
        li.className = Tree.MORE+" "+li.className;
      }
      li.ul=ul; // set the root ul
      li.onclick = function(e) {return Tree.click(this, e);}
      // hilite current link in this item
      var links=li.getElementsByTagName("a");
      if (!links.length) continue;
      // this loop will go inside all links of the <li>, especially children <ul>, bad
      // for(var j=0; j < links.length; j++) {
      a=links[0];
      parent=a;
      // for a folder with no link, do not hilite here
      while(parent=parent.parentNode) {
        if (parent.nodeName.toLowerCase() != 'li') continue;
        if (parent==li) break;
        a=null;
      }
      if(!a) continue;
      // now, check if item should be opened

      target=a.getAttribute('href'); // should return unresolved URI like written in source file
      if(location.pathname != a.pathname) continue; // not same path, go away
      keep = true; // at least, correct path, but check if hash or query could be better
      if(Tree.lastHere && a.hash && !location.hash ) continue; // hash requested, no hash in URI, let first item found
      if(Tree.lastHere && a.hash && a.hash != location.hash ) continue; // hash requested, not good hash in URI, let first item found
      if (Tree.lastHere && a.search && !location.search) continue; // query param requested, no query parma in URI, let first item found
      if (a.search && location.search) {
        search = a.search.replace('?', '&')+'&';
        lost = location.search.replace('?', '&') + '&';
        found = lost.indexOf(search);
        if (Tree.lastHere && found<0) continue; // query param not found, let first item found
      }
      /*
      // class on li or a ?
      if (a.className.indexOf(Tree.HERE) != -1) a.className=a.className.replace(Tree.reHereDel, '');
      a.className += " "+Tree.HERE;
      */
      // close parents of first found
      if (Tree.lastHere) {
        Tree.lastHere.className=Tree.lastHere.className.replace(Tree.reHereDel, '');
        Tree.close(Tree.lastHere);
      }
      // open parents
      Tree.open(li);
      li.className=li.className.replace(Tree.reHereDel, '') +" "+Tree.HERE;
      if (li.focus) li.focus();
      Tree.lastHere=li;
    }
    // add a class for CSS to say this list is set (before display none things)
    if(ul.className.indexOf("treejs") != -1);
    else { ul.className=ul.className+" treejs"; }
    // changing global class should have resized object
    // check if link is visible, if not, scroll to it
    /*
    if (Tree.top(Tree.lastHere) > Tree.winHeight()) {
      lastid = window.location.hash;
      if (lastid == '#') lastid=null;
      Tree.lastHere.id = "lasthere";
      window.location.hash = '#' + Tree.lastHere.id;
      window.location.hash = lastid;
    }
    */
  },


  /**
   * Change ClassName of a <li> onclick to open/close
   */
  click: function (li, e) {
    if(Tree.className != null) li=this;
    if (!li) return false;
    var ret=false;
    var className="";
    var here="";
    if(li.className.indexOf(Tree.LESS) > -1) className=" "+Tree.MORE;
    else if(li.className.indexOf(Tree.MORE) > -1) className=" "+Tree.LESS;
    // if click in a link, force open
    var ev = e || event, src = ev.target || ev.srcElement;
    while (src && src.tagName.toLowerCase() != "li") {
      if (src.tagName.toLowerCase() == 'a') {
        // if link, hilite the parent li
        className=" "+Tree.LESS;
        here=true;
        ret=true;
        break;
      }
      src = src.parentNode;
    }
    // unset the last of this list, and set this one
    if (here) {
      // set it at document level
      if (Tree.lastHere) Tree.lastHere.className=Tree.lastHere.className.replace(Tree.reHereDel, '')
      li.className=li.className.replace(Tree.reHereDel, '')+" "+Tree.HERE;
      Tree.lastHere=li;
    }
    // change class only if already less or more
    if (li.className.search(Tree.reLessmore)>-1) li.className=li.className.replace(Tree.reLessmore, ' ') + className;
    // alert(li.className+" "+className);
    // stop propagation
    if (ev && document.all ) ev.cancelBubble = true;
    if (ev && ev.stopPropagation) ev.stopPropagation();
    return ret;
  },
  /**
   * Recursively open li ancestors
   */
  open: function () {
    var li; // don't forget or may produce some strange var collapse
    for (i=arguments.length - 1; i>=0; i--) {
      li=arguments[i];
      if (li.className == null) li=document.getElementById(arguments[i]);
      if (!li) continue;
      while (li && li.tagName.toLowerCase() == 'li') {
        // avoid icon in front of single item
        if (li.className.match(Tree.reLessmore) || li.getElementsByTagName('UL').length > 0)
          li.className = (li.className.replace(Tree.reLessmore, ' ') +" "+Tree.LESS).trim();
        li=li.parentNode.parentNode; // get a possible li ancestor (jump an ul container)
      }
    }
  },
  /**
   * Recursively close li ancestors
   */
  close: function () {
    var li; // don't forget or may produce some strange var collapse
    for (i=arguments.length - 1; i>=0; i--) {
      li=arguments[i];
      if (li.className == null) li=document.getElementById(arguments[i]);
      if (!li) continue;
      while (li && li.tagName.toLowerCase() == 'li') {
        if (li.className.match(Tree.reLessmore) || li.getElementsByTagName('UL').length > 0)
          li.className = (li.className.replace(Tree.reLessmore, ' ') +" "+Tree.MORE).trim();
        li=li.parentNode.parentNode; // get a possible li ancestor (jump an ul container)
      }
    }
  },
  /**
   * Get an array of elements matching a regular expression,
   * essentially used to get h[1-6]
   *
   * @param node the node from where to search
   * @param re   a regular expression to compile
   * @returns  an array of matching nodes
   */
  getElementsByTagRE: function(re, node) {
    if(!node) node=document.getElementsByTagName("BODY")[0];
    // array of nodes to filter
    var nodeset = node.getElementsByTagName("*");
    if(!re || re == "*") return nodeset;
    if(!re.test) re = new RegExp(re);
    re.ignoreCase = true;
    // array to return
    var select = [];
    for(i = 0; i < nodeset.length; ++i)
      if( re.test(nodeset[i].nodeName.toLowerCase()) ) select.push( nodeset[i] );
    return select;
  },
  /**
   * Hilite an anchor element, now replaced by the :target CSS selector
   */
  hash: function (id) {
    // id maybe an Event
    if (id && id.stopPropagation) id=null;
    // if another element has been hilited
    if (!this.window.anchorLast);
    else {
      this.window.anchorLast.className=this.window.anchorLast.className.replace(/ *mark */g, '');
    }
    if (!id) {
      id=window.location.hash;
      if(id.indexOf('#') != 0) return false;
      id=id.substring(1);
    }
    var o=document.getElementById(id);
    // if (!o) take from anchors array ?
    if(!o) return false;
    if (o.className.indexOf("mark") > -1) return false;
    o.className += " mark";
    this.window.anchorLast=o;
    // here it's OK, but an event scroll the page to its right place after
    return false;
  },
 /**
  * Get an absolute y coordinate for an object
  * [FG] : buggy with absolute object
  * <http://www.quirksmode.org/js/findpos.html>
  *
  * @param object element
  */
  top: function(node) {
    var top  = 0;
    do {
      top += node.offsetTop;
      node = node.offsetParent;
    } while(node && node.tagName.toLowerCase() != 'body');
    return top;
  },
  /**
   * Get viewport height (for example, chek if element is visible)
   */
  winHeight: function() {
    if(!!window.innerWidth) return window.innerHeight;
    var de = document.documentElement;
    if( de && !isNaN(de.clientHeight) ) return de.clientHeight;
    return 0;
  },
  scrollY: function() {
    if( window.pageYOffset ) return window.pageYOffset;
    return Math.max(document.documentElement.scrollTop, document.body.scrollTop);
  }
}
var Notes = {
  load: function() {
    var nl = document.querySelectorAll("a.noteref");
    for (var i = 0, length = nl.length; i< length; i++) {
      nl[i].onmouseover = Notes.over;
      nl[i].onmouseout = Notes.out;
    }
    Notes.div = document.createElementNS("http://www.w3.org/1999/xhtml", 'div');
    Notes.div.id = "noterefover";
    document.getElementsByTagName("body")[0].appendChild(Notes.div);
  },
  over: function() {
    var id = this.href.substr(this.href.indexOf('#')+1);
    if (!id) return;
    var note = document.getElementById(id);
    if (!note) return;
    var pos = Notes.pos(this);
    if (!pos) return;
    Notes.div.className = note.className;
    Notes.div.innerHTML = note.innerHTML;
    Notes.div.style.top = (this.offsetHeight + 10 + pos.top) + 'px';
    Notes.div.style.left = (pos.left - Notes.div.offsetWidth/2) + "px";
    Notes.div.style.visibility = 'visible';
    Notes.div.onmouseout = Notes.out;
  },
  pos: function(el) {
    if (!el.offsetParent) return;
    var left = 0;
    var top = 0;
    // do not substract the body.scrollTop in Chrome, the last offsetParent
    while (el.offsetParent) {
        left += (el.offsetLeft - el.scrollLeft );
        top += (el.offsetTop - el.scrollTop);
        el = el.offsetParent;
    };
    return { left: left, top: top };
  },
  out: function() {
    Notes.div.style.visibility = 'hidden';
    Notes.div.innerHTML = '';
  }
}
Tree.isfirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

Tree.ini();

// if loaded as bottom script, create trees ?
if(window.document.body) {
  Notes.load();
  Tree.load("aside");
}
else if (window.addEventListener) {
  window.addEventListener('load', Tree.load, false);
  window.addEventListener('load', Tree.autotoc, false);
  window.addEventListener('load', Notes.load, false);
}
else if (window.attachEvent) {
  if (!Tree.loaded) window.attachEvent('onload', Tree.load);
  // window.attachEvent('onload', Tree.autotoc);
   window.attachEvent('onload', Notes.load);
}
