   var canvas; // Canvas DOM element
   var ctx; // Canvas rendering context
   var keys; // Keyboard input
   var world; //world class
   var localPlayer; // Local player
   var remotePlayers; // Remote players
   var socket; // Socket connection
   var playerList;
   var consoleList;
   var equiptTable;
   var inventoryTable;
   tiles = new Image();
   tiles.src = "../assets/tiles.png";
   objects = new Image();
   objects.src = "../assets/objects.png";
   actions = new Image();
   actions.src = "../assets/actions.png";
   window.requestAnimFrame = (function() {
       return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function( /* function */ callback, /* DOMElement */ element) {
           // window.setTimeout(callback, 1000/60);
           window.setTimeout(callback, 1000);
       };
   })();

   function init() {
       socket = io.connect('/', { transports: ["websocket"] });
       playerList = document.getElementById("playerList");
       consoleList = document.getElementById("consoleList");
       equiptTable = document.getElementById("equiptTable");
       inventoryTable = document.getElementById("inventoryTable");
       canvas = document.getElementById("gameCanvas");
       ctx = canvas.getContext("2d");
       canvas.width = 512;
       canvas.height = 512;
       keys = new Keys();
       world = new World();
       remotePlayers = [];
       localPlayer = [];
       setEventHandlers();
   }
   //////////////////////////////////////////////////////////////////////////////////////
   function setEventHandlers() {
       window.addEventListener("keydown", onKeydown, false);
       window.addEventListener("keyup", onKeyup, false);
       socket.on("getUserDataClient", getUserDataClient);
       socket.on("newPlayerClient", newPlayer);
       socket.on("movePlayerClient", movePlayer);
       socket.on("removePlayerClient", removePlayer);
       socket.on("disconnect", disconnectPlayer);
   }
   // Keyboard key down
   function onKeydown(e) {
       if (localPlayer) {
           keys.onKeyDown(e);
       };
   };
   // Keyboard key up
   function onKeyup(e) {
       if (localPlayer) {
           keys.onKeyUp(e);
       };
   };

   function disconnectPlayer(data) {
       console.log('user disconnected');
       alert("Server Connection Lost")
       window.location.href = './';
   }

   function getUserDataClient(data) {
       localPlayer = new Player(data.id);
       localPlayer.setX(data.x)
       localPlayer.setY(data.y)
       console.log("----------------------------------------------")
       console.log('ID:  ' + localPlayer.getID());
       console.log('X:  ' + localPlayer.getX());
       console.log('Y:  ' + localPlayer.getY());
       console.log('Equipt:  ' + data.userEquipt);
       localPlayer.setEquipt(data.userEquipt)
       console.log('Inventory:  ' + data.userInventory);
       localPlayer.setInventory(data.userInventory)
       console.log("----------------------------------------------")
       console.log(world.getWorldName())
       socket.emit("getPlayersServer");
       var item = document.createElement('li');
       item.appendChild(document.createTextNode(localPlayer.getID()));
       playerList.appendChild(item);
       //
       var slots = ["Hand", "Head", "Body", "Legs", "Amulet", "Misc"]
       var row = equiptTable.insertRow(0);
       var rowName = equiptTable.insertRow(1);
       for (var i = 0; i <= localPlayer.getEquipt().length - 1; i++) {
           row.insertCell(i).innerHTML = '<img src="./assets/items/' + localPlayer.getEquipt()[i] + '.png">';
           rowName.insertCell(i).innerHTML = slots[i];
       }
       var row = inventoryTable.insertRow(0);
       for (var i = 0; i <= localPlayer.getInventory().length - 1; i++) {
           row.insertCell(i).innerHTML = '<img src="./assets/items/' + localPlayer.getInventory()[i] + '.png">';
       }
       animate();
   };

   function newPlayer(data) {
       // Add new player to the remote players array
       var newPlayer = new Player(data.id);
       newPlayer.setX(data.x)
       newPlayer.setY(data.y)
       if (localPlayer.id != newPlayer.id) {
           console.log("Player connected: " + newPlayer.id);
           remotePlayers.push(newPlayer);
           var item = document.createElement('li');
           item.appendChild(document.createTextNode(newPlayer.id));
           playerList.appendChild(item);
           consoleText(newPlayer.id + " Joined The Server")
       }
   };

   function movePlayer(data) {
       var movePlayer = playerById(data.id);
       // Player not found
       if (!movePlayer) {
           console.log("Player not found: " + data.id);
           return;
       };
       // Update player position
       movePlayer.setX(data.x);
       movePlayer.setY(data.y);
       movePlayer.setDir(data.dir);
   };

   function removePlayer(data) {
       console.log("Player Removed: " + data.id);
       var lis = playerList.getElementsByTagName("li");
       for (var i = lis.length - 1; i >= 0; i--) {
           console.log(lis[i].textContent)
           if (lis[i].textContent == data.id) {
               lis[i].remove()
           }
       }
       var removePlayer = playerById(data.id);
       // Player not found
       if (!removePlayer) {
           console.log("Player not found: " + data.id);
           return;
       };
       // Remove player from array
       consoleText(data.id + " Left The Server")
       remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);
   };

   function consoleText(text) {
       var item = document.createElement('li');
       item.appendChild(document.createTextNode(text));
       consoleList.appendChild(item);
   }
   /**************************************************
    ** GAME ANIMATION LOOP
    **************************************************/
   function animate() {
       update();
       draw();
       // Request a new animation frame using Paul Irish's shim
       // window.requestAnimationFrame(window.requestAnimationFrame);
       window.requestAnimFrame(animate);
       // window.setTimeout(animate, 50);
   };
   /**************************************************
    ** GAME UPDATE
    **************************************************/
   //
   function moveLeft() {
       if (world.getTile(0, localPlayer.getX() - 1, localPlayer.getY()) == 1) {
           return
       }
       if (localPlayer.getCanMove()) {
           var newX = localPlayer.getX()
           localPlayer.setCanMove(false);
           newX -= 1
           localPlayer.setX(newX)
           setTimeout(function() { moveReset() }, localPlayer.getMoveSpeed());
       }
   }

   function moveRight() {
       if (world.getTile(0, localPlayer.getX() + 1, localPlayer.getY()) == 1) {
           return
       }
       if (localPlayer.getCanMove()) {
           var newX = localPlayer.getX()
           localPlayer.setCanMove(false);
           newX += 1
           localPlayer.setX(newX)
           setTimeout(function() { moveReset() }, localPlayer.getMoveSpeed());
       }
   }

   function moveUp() {
       if (world.getTile(0, localPlayer.getX(), localPlayer.getY() - 1) == 1) {
           return
       }
       if (localPlayer.getCanMove()) {
           var newY = localPlayer.getY()
           localPlayer.setCanMove(false);
           newY -= 1
           localPlayer.setY(newY)
           setTimeout(function() { moveReset() }, localPlayer.getMoveSpeed());
       }
   }

   function moveDown() {
       if (world.getTile(0, localPlayer.getX(), localPlayer.getY() + 1) == 1) {
           return
       }
       if (localPlayer.getCanMove()) {
           var newY = localPlayer.getY()
           localPlayer.setCanMove(false);
           newY += 1
           localPlayer.setY(newY)
           setTimeout(function() { moveReset() }, localPlayer.getMoveSpeed());
       }
   }

   function actionReset() {
       localPlayer.setCanAction(true);
   }

   function moveReset() {
       localPlayer.setCanMove(true);
   }

   function update() {
       // console.log((localPlayer.getX()) + " | " + (localPlayer.getY()))
       var prevX = localPlayer.getX();
       var prevY = localPlayer.getY();
       //
       if (keys.up & !keys.down) {
           moveUp()
           localPlayer.setDir("up")
       }
       if (!keys.up & keys.down) {
           moveDown()
           localPlayer.setDir("down")
       }
       //
       if (keys.left & !keys.right) {
           moveLeft();
           localPlayer.setDir("left")
       }
       if (!keys.left & keys.right) {
           moveRight();
           localPlayer.setDir("right")
       };
       if (keys.z) {
           if (localPlayer.getCanAction()) {
               console.log("ATTACK")
               socket.emit("attackActionPlayerServer", { id: localPlayer.getID() });
               localPlayer.setCanAction(false);
               setTimeout(function() { actionReset() }, 300);
           }
       };
       if (keys.x) {
           console.log("USE")
           socket.emit("useActionPlayerServer", { id: localPlayer.getID() });
       };
       if ((prevX != localPlayer.getX() || prevY != localPlayer.getY()) ? true : false) {
           socket.emit("movePlayerServer", { id: localPlayer.getID(), x: localPlayer.getX(), y: localPlayer.getY(), dir: localPlayer.getDir() });
       };
   };
   /**************************************************
    ** GAME DRAW
    **************************************************/
   function draw() {
       ctx.clearRect(0, 0, canvas.width, canvas.height);
       for (var x = 0; x <= world.getWorldWidth(); x++) {
           for (var y = 0; y <= world.getWorldHeight(); y++) {
               ctx.drawImage(tiles, world.getTile(1, x, y) * world.getTileSize(), 0, world.getTileSize(), world.getTileSize(), x * world.getTileSize(), y * world.getTileSize(), world.getTileSize(), world.getTileSize());
           }
       }
       for (var x = 0; x <= world.getWorldWidth(); x++) {
           for (var y = 0; y <= world.getWorldHeight(); y++) {
               ctx.drawImage(objects, world.getTile(2, x, y) * world.getTileSize(), 0, world.getTileSize(), world.getTileSize(), x * world.getTileSize(), y * world.getTileSize(), world.getTileSize(), world.getTileSize());
           }
       }
       // Draw the remote players
       for (var i = 0; i < remotePlayers.length; i++) {
        drawPlayer(remotePlayers[i],ctx)
           // remotePlayers[i].draw(ctx);
       };
       // Draw the local player
       drawPlayer(localPlayer,ctx)
       // localPlayer.draw(ctx);
   };
   /**************************************************
    ** GAME HELPER FUNCTIONS
    **************************************************/
   // Find player by ID
   function playerById(id) {
       var i;
       for (i = 0; i < remotePlayers.length; i++) {
           if (remotePlayers[i].id == id) return remotePlayers[i];
       };
       return false;
   };