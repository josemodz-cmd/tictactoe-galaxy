const cellElements = document.querySelectorAll('[data-cell]')
let boardState = Array(9).fill(null)
let roomId = null
let playerSymbol = null
let database = firebase.database()
let playerId = Math.random().toString(36).substr(2, 9)

function createRoom() {
  roomId = Math.random().toString(36).substr(2, 5).toUpperCase()
  document.getElementById("roomCode").value = roomId
  playerSymbol = "X"

  database.ref("rooms/" + roomId).set({
    board: Array(9).fill(null),
    turn: "X",
    players: { [playerId]: "X" },
    chat: {}
  })

  listenRoom()
  document.getElementById("status").innerText = "Sala creada. Esperando jugador..."
}

function joinRoom() {
  roomId = document.getElementById("roomCode").value

  database.ref("rooms/" + roomId + "/players").once("value", snapshot => {
    let players = snapshot.val()

    if (!players || Object.keys(players).length >= 2) {
      alert("Sala llena")
      return
    }

    playerSymbol = "O"
    database.ref("rooms/" + roomId + "/players/" + playerId).set("O")
    listenRoom()
    document.getElementById("status").innerText = "Conectado como O"
  })
}

function leaveRoom() {
  if (!roomId) return
  database.ref("rooms/" + roomId + "/players/" + playerId).remove()
  roomId = null
  playerSymbol = null
  document.getElementById("status").innerText = "Saliste de la sala"
}

function listenRoom() {
  database.ref("rooms/" + roomId).on("value", snapshot => {
    let data = snapshot.val()
    if (!data) return

    boardState = data.board
    cellElements.forEach((cell, index) => {
      cell.innerText = boardState[index] ? boardState[index] : ""
    })
  })

  database.ref("rooms/" + roomId + "/chat").on("child_added", snapshot => {
    let msg = snapshot.val()
    document.getElementById("messages").innerHTML += "<div>" + msg + "</div>"
  })
}

cellElements.forEach((cell, index) => {
  cell.addEventListener("click", () => {
    if (!roomId || boardState[index]) return

    database.ref("rooms/" + roomId).once("value", snapshot => {
      let data = snapshot.val()
      if (!data || data.turn !== playerSymbol) return

      data.board[index] = playerSymbol

      database.ref("rooms/" + roomId).update({
        board: data.board,
        turn: playerSymbol === "X" ? "O" : "X"
      })
    })
  })
})

function sendMessage() {
  let input = document.getElementById("chatInput")
  if (!input.value || !roomId) return

  database.ref("rooms/" + roomId + "/chat").push(
    playerSymbol + ": " + input.value
  )

  input.value = ""
}
