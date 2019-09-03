// global
var boardGrid;
var columnGrids = []

// ---------------
// need some global counters
var itemId = 0
var videoId = 0 
var textId = 0
var linkId = 0
var imgId = 0
var sketchId = 0
var zooming = false
var userId = "userId"

// item storage
var itemList = []
function addItem(ex,type,id,data){
	let i = {}
	i.work = ex
	i.type = type
	i.id = id
	i.divId = "undefined" // updated after inserting
	i.data = data
	i.tag = "tag not set" // column name. do it when saving"
	itemList.push(i)	// add item
	console.log("items: ",itemList.length)
}

function findItem(id){
	let i = -1
	//console.log("Searching for: ",id, "total items: ",itemList.length)
	for (it in itemList) {
		//console.log("Current: ",itemList[it].divId)
		if (itemList[it].divId === id) {
			//console.log("Found item ",id," at ",it)
			i = it;
			break
		}
	}
	return i
}


async function saveAll(){
	console.log("saving items: ",itemList.length)
	let s = {}
	s.user = userId
	s.tags = categories
	s.works = works
	for (i in itemList) { // update all tags
		let e = document.getElementById(itemList[i].divId)
		//console.log("Saving id: ",e.id)
		let p = e.parentElement  // we should know where the element was placed last
		//console.log("Parent id: ",p.id)
		// find column from parent id
		for (c in categories) {
			if (p.id === "board-column_" + c){
				console.log("Tag column: ",c)
				itemList[i].tag = categories[c]
				break
			}
		}
	}
	s.data = itemList
	let j = await JSON.stringify(s)
	console.log("download size: ",j.length)
	//console.log("download ",j)
	// add download link (from https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
	let l = "data:text/json;charset=utf-8," + encodeURIComponent(j)
	let a = document.getElementById('save');
	a.setAttribute("href", l);
	a.setAttribute("download", "webCollage_" + escape(s.user) + ".json"); // make sure we have proper file name
	a.click();
}


// default artworks and categories
const works = ["Pattern", "Light", "Motion", "Darkness"]
const categories = [
"Wissen",
"Gewußt",
"Nie gewußt",
"Nie mehr wissen"
/*
"Erinnerung",
  "Assoziation",
  "Neuheit",
  "Vergessen"
*/
//  "Erzählung"
]

// --------------------------------------------------------------
// --------------------------------------------------------------
// from grid demo 

  // check if the element has a certain selector
  function elementMatches(element, selector) {
	console.log("elem match for ",selector)
    var p = Element.prototype;
    return (p.matches || p.matchesSelector || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector).call(element, selector);

  }

// remove the item by first setting display to none
// which frees it's space in the grid
// then remove it from the itemList
async function removeItem(element) {
	console.log("Removing: ",element.id)
	let p = element.parentElement
	console.log("Parent: ",p.id)
	element.style.display = "none"; 
	// get item list index
	let i = findItem(element.id)
	// remove item
	if (i >= 0) {
		itemList.splice(i,1) // this removes the single item from the list
	}
	
	// find column from parent id
	for (c in categories) {
		if (p.id === "board-column_" + c){
			console.log("delete from column: ",c)
			columnGrids[c].refreshItems().layout()
		  	await Sleep(100)
			break
		}
	}
}


// --------------------------------------------------------------
// --------------------------------------------------------------



document.addEventListener('DOMContentLoaded', function() {

  var docElem = document.documentElement;
  var kanban = document.querySelector('.chart');
  var board = kanban.querySelector('.board');
  // add containers
  let cw = Math.floor(100 / categories.length) - 1 // column width
  for (c in categories) {
    let cat = categories[c]
    console.log(cat)
    let cc = document.createElement('div');
    cc.setAttribute("class", "board-column")
    cc.setAttribute("style", "width:" + cw + "%")
    console.log(cc.getAttribute("style"))
    let content = '<div class="board-column-header">' + cat + '</div>'
    content += '<div id="board-column_' + c + '" class="board-column-content"></div>'
    cc.innerHTML = content;
    board.appendChild(cc);
  }
  var itemContainers = Array.prototype.slice.call(kanban.querySelectorAll('.board-column-content'));
  var dragCounter = 0;

  itemContainers.forEach(function(container) {
    var muuri = new Muuri(container, {
        items: '.board-item',
        layoutDuration: 400,
        layoutEasing: 'ease',
        dragEnabled: true,
        dragSort: function() {
          return columnGrids;
        },
        dragSortInterval: 10, // was 0
        dragContainer: document.body,
        dragReleaseDuration: 400,
        dragReleaseEasing: 'ease',

		//
		dragStartPredicate: function (item, event) {
		  let isRemoveAction = elementMatches(event.target, '.item-remove');
		  let isZoomAction = elementMatches(event.target, '.item-zoom');
		  let e = item.getElement()
		  if (isRemoveAction) {
				console.log("remove item: ", e.id)
				removeItem(e)
		  }
		  if (isZoomAction) {
				console.log("zoom item: ", e.id)
				zoom(e.id)
		  }
		  if (isZoomAction) console.log("zoom item", e.id)
		  return (!isRemoveAction && !isZoomAction) ? Muuri.ItemDrag.defaultStartPredicate(item, event) : false;
		}


      })
      .on('dragStart', function(item) {
        ++dragCounter;
        docElem.classList.add('dragging');
        item.getElement().style.width = item.getWidth() + 'px';
        item.getElement().style.height = item.getHeight() + 'px';
      })
      .on('dragEnd', function(item) {
        if (--dragCounter < 1) {
          docElem.classList.remove('dragging');
        }
      })
      .on('dragReleaseEnd', function(item) {
        item.getElement().style.width = '';
        item.getElement().style.height = '';
        columnGrids.forEach(function(muuri) {
          muuri.refreshItems();
        });
      })
      .on('layoutStart', function() {
        boardGrid.refreshItems().layout();
      });

    columnGrids.push(muuri);

  });

  boardGrid = new Muuri(board, {
    layoutDuration: 400,
    layoutEasing: 'ease',
    dragEnabled: false, // we don't drag the columns
    dragSortInterval: 10, // was 0
    dragStartPredicate: {
      handle: '.board-column-header'
    },
    dragReleaseDuration: 400,
    dragReleaseEasing: 'ease'
  });

  // set artwork items
  let aw = document.getElementById("artselect")
  for (w in works) {
    console.log(works[w])
    let o = document.createElement('option');
    o.innerHTML = works[w]
    aw.appendChild(o);
  }

  // set default layout
  toWide()

});


// zoom functions
function zoom(id){
	// don't act if zooming
	if (!zooming) {
		console.log("zooming: ",id)
		// get modal container
		let m = document.getElementById("modal")
		let z = document.getElementById(id)
		// content is in child 1, don't remove child 0
		let c = m.children[1]
		c.innerHTML = z.innerHTML // copy
		zooming = true
		// activate
		m.classList.add('modal-shown');
	} 
}

function zoomEnd(){
	// don't act if not zooming
	if (zooming) {
		console.log("unzooming: ",zooming)
		let z = document.getElementById("modal") // container
		// removal class
		z.classList.remove("modal-shown")
		// content is in child 1, don't remove child 0
		let c = z.children[1]
		// remove content
		while (c.firstChild) {
			console.log("remove child")
			c.removeChild(c.firstChild);
		}
		zooming = false
	} 
}

async function inserttext(t, ex) {
  todo = columnGrids[0]; //muuri grid

  itemId ++
  // Generate new element
  var id = todo.getItems().length + 1
  // update the divId of the last element
  let divId = "item_" + itemId
  itemList[itemList.length - 1].divId = divId
  var newElem = document.createElement('div');
  var content = '<div class="board-item"'
  content += 'id=item_' + itemId + ''
  content += '><div class="board-item-content"><h3>'
  content += '<span style="float:left; background-color: white; color: black;" class="item-zoom" id="zoom_' + itemId + '">&nbsp;&#8981;&nbsp;</span>'
  content += '<span style="max-width:70%;">' + ex + '</span>'
  content += '<span style="float:right; background-color: white; color: black;" class="item-remove" id="remove_' + itemId + '">&nbsp;&#10007;&nbsp;</span>'
  content += '</h3>'	
  // adding button to content doesn't work. must use muuri api
  // content += '<button type="button" id="btnX_' + itemId + '">X</button>'

  content += t
  console.log("Content size: ",t.length)

  content += '</div></div>'

  newElem.innerHTML = content;

  // Add the elements to the grid.
  todo.add(newElem.firstChild);

  todo.refreshItems().layout()
  await Sleep(100)
  // try to refresh all
  await boardGrid.refreshItems().layout()
}



// -----------

// helper function for delay
function Sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

// close editor and update board
async function closeEditor(id) {
  if (id) {
	  //await Sleep(1000);
	  // we need to switch first, otherwise the element is inserted
	  // with the smaller width which causes problems in the drag and drop mechanism
	  await toWide()

    // get the artwork
    let aw = document.getElementById("artselect")
    let ex = aw.options[aw.selectedIndex].text;

	console.log("Processing id: ",id)
    let type = id.split("_")[0]
    let t

    switch (type) {
      case undefined:
        console.log("null")
        break
      case "tfield":
        console.log("text field")
        console.log(id)
        t = document.getElementById(id).value
        t = t.replace(/(?:\r\n|\r|\n)/g, "<br>")
		t = '<p class="textitem">' + t + '</p>'
		addItem(ex,type,id,t)
        await inserttext(t, ex)
        break
      case "lframe":
        console.log("iframe: ",id)
        t = document.getElementById(id).innerHTML
		addItem(ex,type,id,t)
        await inserttext(t, ex)
        break
      case "image":
            console.log("image: ",id)
            t = document.getElementById(id).innerHTML
			addItem(ex,type,id,t)
            await inserttext(t, ex)
            break
      case "video":
            console.log("video: ",id)
            t = document.getElementById(id).innerHTML
			addItem(ex,type,id,t)
            await inserttext(t, ex)
            break
	  case "sketch":
         console.log("sketch: ",id)
		let container = document.getElementById(id)
		let canvas = container.firstChild
		console.log("canvas: ",canvas.width, canvas.height)
		let dataURL = canvas.toDataURL('image/png');
		// create an image with the url as source
		let img = '<img width=100% src="'
		img += dataURL
		img += '">'
		addItem(ex,type,id,img)
        await inserttext(img, ex)

		break		
      default:
        console.log("something else:", type)
        break
    }
  }
  // at the end, remove edit item and all content
  let e = document.getElementById("editor")
  // remove all, if exist
  while (e.firstChild) {
    e.removeChild(e.firstChild);
  }
  //await Sleep(1000);
  //await toWide()
}


function newtext() {
  // large editor area
  toSmall()

  let e = document.getElementById("editor")
  // remove all, if exist
  while (e.firstChild) {
    e.removeChild(e.firstChild);
  }
  let ee, content
  // create the text area
  textId++
  let id = "tfield_" + textId
  ee = document.createElement('div');
  et = document.createElement('textarea');
  et.setAttribute("class", "tfield")
  et.setAttribute("id", id)
  et.setAttribute("rows", 3)
  et.setAttribute("cols", 30)
  et.setAttribute("wrap", "soft")
  et.setAttribute("placeholder", "Space for your ideas...")

  ee.appendChild(et);
  e.appendChild(ee);

  // create editor buttons
  ee = document.createElement('p');
  content = '<button style="float:left;" onclick=closeEditor("' + id + '")>OK</button>'
  content += '<button onclick=closeEditor()>Zurück</button>'
  ee.innerHTML = content;
  e.appendChild(ee);

}

// --- video
function newvideo() {
  let select = document.getElementById("videoUp")
  let files = select.files;
  //let files = document.getElementById("videoUp").files;
  let reader = new FileReader();
  reader.addEventListener("load", function() {
    // we have to full file, could send it to server
    // make sure PHP upload size is large enough
    msg = "video loaded"
    console.log(msg)
    //document.getElementById("debug").innerHTML = msg
    let video = reader.result;

    // large editor area
    toSmall()

    let e = document.getElementById("editor")
    // remove all, if exist
    while (e.firstChild) {
      e.removeChild(e.firstChild);
    }

    // create the video field
    videoId++
    let id = "video_" + videoId
    // create video container
    let ee = document.createElement('div');
    ee.setAttribute("id", id)
    // create the player
    let pid = "videoplayer_" + videoId
    let ev = document.createElement('video');
    ev.setAttribute("id", pid)
    ev.setAttribute("width", "100%")
    ev.setAttribute("playsinline","true")
    ev.setAttribute("controls","true")
    ev.setAttribute("src", video)
    ee.appendChild(ev);

    e.appendChild(ee);
    // play
    ev.play();

    // create editor buttons
    ee = document.createElement('p');
    content = '<button style="float:left;" onclick=closeEditor("' + id + '")>OK</button>'
    content += '<button onclick=closeEditor()>Zurück</button>'
    ee.innerHTML = content;
    e.appendChild(ee);

  }, false);

  if (files[0]) {
    msg = "loading video ..."
    console.log(msg)
    //document.getElementById("debug").innerHTML = msg
    reader.readAsDataURL(files[0]);
  }
  select.value = null;

};


// --- sketch
function newsketch() {
  // large editor area
  toSmall()

  let e = document.getElementById("editor")
  // remove all, if exist
  while (e.firstChild) {
    e.removeChild(e.firstChild);
  }
  let ee, content
  // create the sketch area
  sketchId++
  let id = "sketch_" + sketchId
  ee = document.createElement('div');
  ee.setAttribute("id", id)
  e.appendChild(ee)


  // create editor buttons
  ee = document.createElement('p');
  content = '<button style="float:left;" onclick=closeEditor("' + id + '")>OK</button>'
  content += '<button onclick=closeEditor()>Zurück</button>'
  ee.innerHTML = content;
  e.appendChild(ee);



    var radius = 10;

    let canvas = Sketch.create({

        container: document.getElementById( id ),
		fullscreen: false,
		width: 500,
		height: 300,
        autoclear: false,
        retina: 'auto',

        setup: function() {
            console.log( 'setup' )
        },

        // Event handlers

        keydown: function() {
            if ( this.keys.C ) this.clear();
        },

        // Mouse & touch events are merged, so handling touch events by default
        // and powering sketches using the touches array is recommended for easy
        // scalability. If you only need to handle the mouse / desktop browsers,
        // use the 0th touch element and you get wider device support for free.
        touchmove: function() {

            for ( var i = this.touches.length - 1, touch; i >= 0; i-- ) {

                touch = this.touches[i];

                this.lineCap = 'round';
                this.lineJoin = 'round';
                this.fillStyle = this.strokeStyle = "#000";
                this.lineWidth = radius;

                this.beginPath();
                this.moveTo( touch.ox, touch.oy );
                this.lineTo( touch.x, touch.y );
                this.stroke();
            }
        }
    });


}


// --- image
async function newimage() {

  let select = document.getElementById("imageUp")
  let files = select.files;
  // large editor area
  await toSmall()

  //let files = document.getElementById("videoUp").files;
  let reader = new FileReader();
  reader.addEventListener("load", function() {
    // we have to full file, could send it to server
    // make sure PHP upload size is large enough
    msg = "image loaded"
    console.log(msg)
    //document.getElementById("debug").innerHTML = msg
    let img = reader.result;
    // console.log(img) // looks OK

    let e = document.getElementById("editor")
    // remove all, if exist
    while (e.firstChild) {
      e.removeChild(e.firstChild);
    }

	  // get width of the element
	  let width = e.offsetWidth
	  // console.log("editor width: ",width)

    // create the image field
    imgId++
    let id = "image_" + imgId
    // create image container
    let ee = document.createElement('div');
    ee.setAttribute("id", id)
    // create the image
    let ei = document.createElement('img');
    ei.setAttribute("width", "100%")
    ei.setAttribute("max-height", "50vh")
    ei.setAttribute("src", img)
    ee.appendChild(ei);

    e.appendChild(ee);

    // create editor buttons
    ee = document.createElement('p');
    content = '<button style="float:left;" onclick=closeEditor("' + id + '")>OK</button>'
    content += '<button onclick=closeEditor()>Zurück</button>'
    ee.innerHTML = content;
    e.appendChild(ee);

  }, false);

  if (files[0]) {
    msg = "loading image ..."
    console.log(msg)
    //document.getElementById("debug").innerHTML = msg
    reader.readAsDataURL(files[0]);
  }

  select.value = null;

}


// -- iframe
async function newframe() {
  // large editor area
  await toSmall()

  let e = document.getElementById("editor")
  // remove all, if exist
  while (e.firstChild) {
    e.removeChild(e.firstChild);
  }

  // create the input field
  linkId++
  let lid = "lfield_" + linkId
  let fid = "lframe_" + linkId

  let et = document.createElement('input');
  et.setAttribute("type", "text")
  et.setAttribute("id", lid)
  et.setAttribute("placeholder", "Enter URL and press Return")
  et.setAttribute("onchange", 'previewLink("' + lid + '","' + fid + '")')
  e.appendChild(et);

  // iframe div
  let ef = document.createElement('div'); // for the iframe
  ef.setAttribute("class", "lfield")
  ef.setAttribute("id", fid)

  e.appendChild(ef);

  // create editor buttons
  let ee = document.createElement('p');

  content = '<button style="float:left;" onclick=closeEditor("' + fid + '")>OK</button>'
  content += '<button onclick=closeEditor()>Zurück</button>'
  ee.innerHTML = content;
  e.appendChild(ee);

}

function previewLink(lid, fid) {
  let l = document.getElementById(lid)
  let lnk = l.value
  console.log(lnk);

  // check http://
  if ((lnk.indexOf("http://") < 0) && (lnk.indexOf("https://") < 0)) {
	lnk = "https://" + lnk
	l.value = lnk
  }

  // check youtube embedding
  // <iframe width="424" height="238" src="https://www.youtube.com/embed/qEWxmXwSOc0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  if (lnk.indexOf("<iframe") >= 0) {
	console.log("Iframe link: ", lnk)
	let sl = lnk.split("src=")[1].split(" ")[0].split('"')[1]
	console.log(" -> ", sl)
	lnk = sl
	l.value = lnk
  }


  // get width of the container
  let width = document.getElementById("editor").offsetWidth
  console.log("editor width: ",width)
  let height = Math.floor(width * .5)

  //l.value = "https://www.youtube.com/embed/1QikBm8RViA"

  let f = document.getElementById(fid)
  // remove all previous, if any
  while (f.firstChild) {
    f.removeChild(f.firstChild);
  }

  let ff = document.createElement('iframe');
  ff.setAttribute("width", "100%")
  //ff.removeAttribute("height")
  //ff.setAttribute("max-height","40vh")
  ff.setAttribute("height",height+"px")
  ff.setAttribute("frameborder", "0")
  ff.setAttribute("allow", "autoplay; encrypted-media;")
  ff.setAttribute("src", lnk + "?playsinline=1")
  //ff.setAttribute("sandbox",true)
  f.appendChild(ff)
}


// --------

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}


// helper to adjust grid size
async function toWide() {
  let d = document.getElementsByClassName("outer-grid")[0];
  d.setAttribute("style", "grid-template-columns: 12% 8% 80%");
  await Sleep(50)
  await boardGrid.refreshItems().layout()

}

async function toSmall() {
  let d = document.getElementsByClassName("outer-grid")[0];
  d.setAttribute("style", "grid-template-columns: 12% 48% 40%");
  await Sleep(50)
  await boardGrid.refreshItems().layout()
}

// --------
// helper to activate input file element from button click
function newInpBtn(id) {
  let inp = document.getElementById(id)
  inp.click()
}

